"""
One-shot ingestion script: fetch -> chunk -> embed -> store in pgvector.
Run from backend/ingestion/ after docker compose db is up and migrated.
Usage: python ingest.py
Requires: DATABASE_URL and OPENAI_API_KEY in environment (or .env in backend/).
"""
import hashlib
import json
import os
import sys

import psycopg2
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import OpenAI

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])
# Strip Prisma-specific ?schema= param — psycopg2 doesn't accept it
DATABASE_URL = os.environ['DATABASE_URL'].split('?')[0]
SPLITTER = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)


def embed(text: str) -> list[float]:
    response = client.embeddings.create(model='text-embedding-3-small', input=text)
    return response.data[0].embedding


def fetch_text(url: str) -> str:
    headers = {'User-Agent': 'CivicLens/1.0'}
    try:
        response = requests.get(url, timeout=30, headers=headers)
    except requests.exceptions.SSLError:
        # Some authoritative sources (e.g. dallascityhall.com) serve an
        # incomplete TLS chain — the leaf cert without its intermediate — which
        # browsers paper over via AIA but Python's requests rejects. Retry once
        # without chain verification so we can still ingest the page. Scoped to
        # the SSL-error path only; all other failures still propagate. Mirrors
        # the citation validator's handling of the same hosts.
        import urllib3

        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        print(f"    TLS chain incomplete for {url} — retrying without verification")
        response = requests.get(url, timeout=30, headers=headers, verify=False)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    for tag in soup(['script', 'style', 'nav', 'footer']):
        tag.decompose()
    return soup.get_text(separator='\n', strip=True)


def compute_chunks_hash(chunks: list[str]) -> str:
    """SHA-256 of sorted chunk texts joined with newline -- order-stable across runs."""
    joined = '\n'.join(sorted(chunks))
    return hashlib.sha256(joined.encode('utf-8')).hexdigest()


def ingest_source(conn: psycopg2.extensions.connection, source: dict) -> None:
    print(f"  Fetching: {source['title']} ({source['url']})")
    text = fetch_text(source['url'])
    chunks = SPLITTER.split_text(text)
    print(f"  Chunked into {len(chunks)} pieces")

    new_hash = compute_chunks_hash(chunks)

    with conn.cursor() as cur:
        # Upsert the source and retrieve current hash + id
        cur.execute(
            """
            INSERT INTO "RegulatorySource"
              (id, title, agency, jurisdiction, source_url, source_type, last_checked_at)
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (source_url) DO UPDATE
              SET title = EXCLUDED.title, last_checked_at = NOW()
            RETURNING id, source_text_hash
            """,
            (source['title'], source['agency'], source['jurisdiction'],
             source['url'], source['type']),
        )
        row = cur.fetchone()
        if row is None:
            raise RuntimeError(f"Failed to upsert source: {source['url']}")
        source_id, old_hash = row

        # Determine change type and summary
        if old_hash is None:
            change_type = 'new_source'
            diff_summary = f"First ingestion of {source['title']}."
            added_chunks = len(chunks)
            removed_chunks = 0
        elif old_hash == new_hash:
            change_type = 'no_change'
            diff_summary = None
            added_chunks = 0
            removed_chunks = 0
        else:
            change_type = 'content_changed'
            diff_summary = f"Content of {source['title']} changed since last ingestion."
            added_chunks = len(chunks)
            removed_chunks = 0  # chunk count before delete not tracked; set 0

        # Insert changelog row
        cur.execute(
            """
            INSERT INTO "SourceChangeLog"
              (id, source_id, old_hash, new_hash, change_type, diff_summary,
               added_chunks, removed_chunks)
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s)
            """,
            (source_id, old_hash, new_hash, change_type, diff_summary,
             added_chunks, removed_chunks),
        )

        # Update stored hash on source
        cur.execute(
            'UPDATE "RegulatorySource" SET source_text_hash = %s WHERE id = %s',
            (new_hash, source_id),
        )

        # Delete old chunks only if content changed or new source
        if change_type != 'no_change':
            cur.execute(
                'DELETE FROM "RegulatoryChunk" WHERE source_id = %s', (source_id,)
            )

    if change_type != 'no_change':
        with conn.cursor() as cur:
            for i, chunk in enumerate(chunks):
                embedding = embed(chunk)
                embedding_str = f"[{','.join(str(x) for x in embedding)}]"
                cur.execute(
                    """
                    INSERT INTO "RegulatoryChunk"
                      (id, source_id, text, embedding,
                       jurisdiction_tags, industry_tags, activity_tags)
                    VALUES (gen_random_uuid(), %s, %s, %s::vector, %s, %s, %s)
                    """,
                    (
                        source_id,
                        chunk,
                        embedding_str,
                        source.get('jurisdiction_tags', []),
                        source.get('industry_tags', []),
                        source.get('activity_tags', []),
                    ),
                )
                if (i + 1) % 10 == 0:
                    print(f"    Embedded {i + 1}/{len(chunks)} chunks...")

    conn.commit()
    print(f"  Done: {change_type} ({len(chunks)} chunks)\n")


def main() -> None:
    sources_path = os.path.join(os.path.dirname(__file__), 'sources.json')
    with open(sources_path) as f:
        sources = json.load(f)

    conn = psycopg2.connect(DATABASE_URL)
    print(f"Connected to database. Ingesting {len(sources)} sources...\n")

    for source in sources:
        try:
            ingest_source(conn, source)
        except Exception as e:
            print(f"  Failed '{source['title']}': {e}\n", file=sys.stderr)
            conn.rollback()

    conn.close()
    print("Ingestion complete.")


if __name__ == '__main__':
    main()
