"""
One-shot ingestion script: fetch -> chunk -> embed -> store in pgvector.
Run from backend/ingestion/ after docker compose db is up and migrated.
Usage: python ingest.py
Requires: DATABASE_URL and OPENAI_API_KEY in environment (or .env in backend/).
"""
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
    response = requests.get(url, timeout=30, headers={'User-Agent': 'CivicLens/1.0'})
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    for tag in soup(['script', 'style', 'nav', 'footer']):
        tag.decompose()
    return soup.get_text(separator='\n', strip=True)


def ingest_source(conn: psycopg2.extensions.connection, source: dict) -> None:
    print(f"  Fetching: {source['title']} ({source['url']})")
    text = fetch_text(source['url'])
    chunks = SPLITTER.split_text(text)
    print(f"  Chunked into {len(chunks)} pieces")

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "RegulatorySource"
              (id, title, agency, jurisdiction, source_url, source_type)
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s)
            ON CONFLICT (source_url) DO UPDATE
              SET title = EXCLUDED.title
            RETURNING id
            """,
            (source['title'], source['agency'], source['jurisdiction'],
             source['url'], source['type']),
        )
        row = cur.fetchone()
        if row is None:
            raise RuntimeError(f"Failed to upsert source: {source['url']}")
        source_id = row[0]

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
    print(f"  Done ({len(chunks)} chunks stored)\n")


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

    conn.close()
    print("Ingestion complete.")


if __name__ == '__main__':
    main()
