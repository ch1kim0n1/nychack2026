# CivicLens Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional NestJS backend with RAG pipeline, PostgreSQL/pgvector, OpenAI GPT-4o integration, and a Python data ingestion script — plus a Next.js frontend placeholder.

**Architecture:** Three NestJS feature modules (profile, risk, diff) share a global DatabaseModule (Prisma) and a RagModule (OpenAI embeddings + pgvector vector search). The Python ingestion script is a one-shot loader that chunks regulatory documents, embeds them, and stores them in pgvector. Scenario A diff data lives in a static JSON file, not in the DB.

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL 15 + pgvector, OpenAI SDK v4 (GPT-4o + text-embedding-3-small), class-validator, Jest + supertest, Docker Compose, Python 3.11 + LangChain + psycopg2.

---

## File Map

```
nychack2026/
├── frontend/
│   └── placeholder.md                          [CREATE - Task 11]
│
└── backend/
    ├── docker-compose.yml                      [CREATE - Task 2]
    ├── .env.example                            [CREATE - Task 2]
    ├── package.json                            [CREATE - Task 1 via nest new]
    ├── nest-cli.json                           [CREATE - Task 1 via nest new]
    ├── tsconfig.json                           [CREATE - Task 1 via nest new]
    ├── tsconfig.build.json                     [CREATE - Task 1 via nest new]
    │
    ├── prisma/
    │   ├── schema.prisma                       [CREATE - Task 3]
    │   └── seed.ts                             [CREATE - Task 9]
    │
    ├── src/
    │   ├── main.ts                             [CREATE - Task 8]
    │   ├── app.module.ts                       [CREATE - Task 8]
    │   │
    │   ├── database/
    │   │   ├── prisma.service.ts               [CREATE - Task 3]
    │   │   └── prisma.module.ts                [CREATE - Task 3]
    │   │
    │   ├── profile/
    │   │   ├── dto/
    │   │   │   └── classify-profile.dto.ts     [CREATE - Task 4]
    │   │   ├── profile.service.ts              [CREATE - Task 4]
    │   │   ├── profile.service.spec.ts         [CREATE - Task 4]
    │   │   ├── profile.controller.ts           [CREATE - Task 4]
    │   │   └── profile.module.ts               [CREATE - Task 4]
    │   │
    │   ├── rag/
    │   │   ├── rag.service.ts                  [CREATE - Task 5]
    │   │   ├── rag.service.spec.ts             [CREATE - Task 5]
    │   │   └── rag.module.ts                   [CREATE - Task 5]
    │   │
    │   ├── risk/
    │   │   ├── dto/
    │   │   │   └── analyze-risk.dto.ts         [CREATE - Task 6]
    │   │   ├── risk.service.ts                 [CREATE - Task 6]
    │   │   ├── risk.service.spec.ts            [CREATE - Task 6]
    │   │   ├── risk.controller.ts              [CREATE - Task 6]
    │   │   └── risk.module.ts                  [CREATE - Task 6]
    │   │
    │   └── diff/
    │       ├── scenarios/
    │       │   └── scenario-a.json             [CREATE - Task 7]
    │       ├── diff.service.ts                 [CREATE - Task 7]
    │       ├── diff.service.spec.ts            [CREATE - Task 7]
    │       ├── diff.controller.ts              [CREATE - Task 7]
    │       └── diff.module.ts                  [CREATE - Task 7]
    │
    ├── test/
    │   ├── profile.e2e-spec.ts                 [CREATE - Task 8]
    │   ├── risk.e2e-spec.ts                    [CREATE - Task 8]
    │   ├── diff.e2e-spec.ts                    [CREATE - Task 8]
    │   └── jest-e2e.json                       [CREATE - Task 1 via nest new]
    │
    └── ingestion/
        ├── ingest.py                           [CREATE - Task 10]
        ├── requirements.txt                    [CREATE - Task 10]
        └── sources.json                        [CREATE - Task 10]
```

---

## Task 1: Scaffold NestJS project

**Files:** Everything under `backend/` created by `nest new`

- [ ] **Step 1: Scaffold the NestJS project**

Run from repo root (`nychack2026/`):
```bash
npx @nestjs/cli new backend --package-manager npm --skip-git
```
When prompted for package manager, select `npm`. Expected: `backend/` folder created, `npm install` runs, output ends with `🚀  Successfully created project backend`.

- [ ] **Step 2: Install additional dependencies**

```bash
cd backend
npm install @prisma/client openai class-validator class-transformer
npm install -D prisma
```
Expected: No errors. `package.json` now lists `openai`, `@prisma/client`, `class-validator`, `class-transformer` in dependencies and `prisma` in devDependencies.

- [ ] **Step 3: Enable ValidationPipe globally — add to tsconfig**

Open `backend/tsconfig.json` and verify `"emitDecoratorMetadata": true` and `"experimentalDecorators": true` are present. If not, add them inside `"compilerOptions"`:
```json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```

- [ ] **Step 4: Delete default boilerplate files**

```bash
rm backend/src/app.controller.ts
rm backend/src/app.controller.spec.ts
rm backend/src/app.service.ts
```

- [ ] **Step 5: Verify tests still pass (empty suite)**

```bash
cd backend && npm test -- --passWithNoTests
```
Expected: `Test Suites: 0 passed` or similar — no failures.

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: scaffold NestJS backend with dependencies"
```

---

## Task 2: Docker Compose + environment config

**Files:** `backend/docker-compose.yml`, `backend/.env.example`, `backend/.env`

- [ ] **Step 1: Create docker-compose.yml**

Create `backend/docker-compose.yml`:
```yaml
version: '3.8'

services:
  db:
    image: pgvector/pgvector:pg15
    container_name: civiclens-db
    environment:
      POSTGRES_USER: civiclens
      POSTGRES_PASSWORD: civiclens
      POSTGRES_DB: civiclens
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U civiclens"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

- [ ] **Step 2: Create .env.example**

Create `backend/.env.example`:
```
DATABASE_URL="postgresql://civiclens:civiclens@localhost:5432/civiclens?schema=public"
OPENAI_API_KEY="sk-your-key-here"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

- [ ] **Step 3: Create .env from example**

```bash
cp backend/.env.example backend/.env
```
Then open `backend/.env` and replace `sk-your-key-here` with your real OpenAI API key.

- [ ] **Step 4: Start the database**

```bash
cd backend && docker compose up -d
```
Expected: `civiclens-db` container starts. Verify with `docker ps` — status should show `healthy` after ~10 seconds.

- [ ] **Step 5: Commit**

```bash
git add backend/docker-compose.yml backend/.env.example
git commit -m "feat: add docker-compose for PostgreSQL + pgvector"
```
Note: `.env` is NOT committed (add to `.gitignore` if not already there).

---

## Task 3: Prisma schema + DatabaseModule

**Files:** `backend/prisma/schema.prisma`, `backend/src/database/prisma.service.ts`, `backend/src/database/prisma.module.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
cd backend && npx prisma init --datasource-provider postgresql
```
Expected: `prisma/schema.prisma` and `.env` created/updated. Since `.env` already exists, Prisma will warn — that's fine.

- [ ] **Step 2: Write schema.prisma**

Replace the contents of `backend/prisma/schema.prisma` entirely:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

model Business {
  id              String        @id @default(uuid())
  name            String?
  city            String
  county          String?
  state           String        @default("TX")
  industry_code   String
  activities      Json
  expansion_plans Json?
  created_at      DateTime      @default(now())
  updated_at      DateTime      @updatedAt
  risk_findings   RiskFinding[]
}

model RegulatorySource {
  id              String            @id @default(uuid())
  title           String
  agency          String
  jurisdiction    String
  source_url      String            @unique
  source_type     String
  last_checked_at DateTime?
  chunks          RegulatoryChunk[]
}

model RegulatoryChunk {
  id                String           @id @default(uuid())
  source_id         String
  source            RegulatorySource @relation(fields: [source_id], references: [id])
  text              String
  embedding         Unsupported("vector(1536)")?
  jurisdiction_tags String[]
  industry_tags     String[]
  activity_tags     String[]
}

model RiskFinding {
  id                 String   @id @default(uuid())
  business_id        String
  business           Business @relation(fields: [business_id], references: [id])
  risk_level         String
  affected_area      String
  explanation        String
  recommended_action String
  source_url         String
  created_at         DateTime @default(now())
}
```

- [ ] **Step 3: Run migration**

```bash
cd backend && npx prisma migrate dev --name init
```
Expected: Migration created and applied. Output includes `Your database is now in sync with your schema.`

- [ ] **Step 4: Generate Prisma client**

```bash
cd backend && npx prisma generate
```
Expected: `✔ Generated Prisma Client` output.

- [ ] **Step 5: Write PrismaService**

Create `backend/src/database/prisma.service.ts`:
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

- [ ] **Step 6: Write DatabaseModule**

Create `backend/src/database/prisma.module.ts`:
```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

- [ ] **Step 7: Verify Prisma connects**

```bash
cd backend && npx prisma studio
```
Expected: Browser opens Prisma Studio showing all 4 tables (Business, RegulatorySource, RegulatoryChunk, RiskFinding). Close studio after confirming.

- [ ] **Step 8: Commit**

```bash
git add backend/prisma/ backend/src/database/
git commit -m "feat: add Prisma schema with pgvector + DatabaseModule"
```

---

## Task 4: ProfileModule

**Files:** `backend/src/profile/profile.service.ts`, `backend/src/profile/profile.service.spec.ts`, `backend/src/profile/profile.controller.ts`, `backend/src/profile/dto/classify-profile.dto.ts`, `backend/src/profile/profile.module.ts`

- [ ] **Step 1: Write the failing unit test**

Create `backend/src/profile/profile.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';

const mockCreate = jest.fn();
jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
);

describe('ProfileService', () => {
  let service: ProfileService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfileService],
    }).compile();
    service = module.get<ProfileService>(ProfileService);
  });

  it('classifies a food truck business profile', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            industry: 'food_service',
            location: 'Dallas, TX',
            expansion_locations: ['Austin, TX'],
            activities: ['food_preparation', 'alcohol_planned'],
            employees: 3,
          }),
        },
      }],
    });

    const result = await service.classify(
      'I own a food truck in Dallas with 3 employees and want to open in Austin with alcohol.',
    );

    expect(result.industry).toBe('food_service');
    expect(result.location).toBe('Dallas, TX');
    expect(result.expansion_locations).toContain('Austin, TX');
    expect(result.activities).toContain('alcohol_planned');
  });

  it('returns null employees when not mentioned', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            industry: 'retail',
            location: 'Houston, TX',
            expansion_locations: [],
            activities: ['retail_sales'],
            employees: null,
          }),
        },
      }],
    });

    const result = await service.classify('I run a retail shop in Houston.');
    expect(result.employees).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npm test -- --testPathPattern=profile.service --no-coverage
```
Expected: FAIL — `Cannot find module './profile.service'`

- [ ] **Step 3: Create the DTO**

Create `backend/src/profile/dto/classify-profile.dto.ts`:
```typescript
import { IsString, MinLength } from 'class-validator';

export class ClassifyProfileDto {
  @IsString()
  @MinLength(10)
  input: string;
}
```

- [ ] **Step 4: Write ProfileService**

Create `backend/src/profile/profile.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

export interface BusinessProfile {
  industry: string;
  location: string;
  expansion_locations: string[];
  activities: string[];
  employees: number | null;
}

@Injectable()
export class ProfileService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async classify(input: string): Promise<BusinessProfile> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a business classification assistant for Texas regulatory compliance.
Extract structured information from the user's description. Return ONLY valid JSON — no markdown, no explanation.
Return exactly this shape:
{
  "industry": "food_service|retail|cosmetology|construction|childcare|other",
  "location": "City, TX",
  "expansion_locations": ["City, TX"],
  "activities": ["food_preparation", "alcohol_planned", "outdoor_seating", "nail_services", etc],
  "employees": number or null
}`,
        },
        { role: 'user', content: input },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content!) as BusinessProfile;
  }
}
```

- [ ] **Step 5: Write ProfileController**

Create `backend/src/profile/profile.controller.ts`:
```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { ProfileService, BusinessProfile } from './profile.service';
import { ClassifyProfileDto } from './dto/classify-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('classify')
  classify(@Body() dto: ClassifyProfileDto): Promise<BusinessProfile> {
    return this.profileService.classify(dto.input);
  }
}
```

- [ ] **Step 6: Write ProfileModule**

Create `backend/src/profile/profile.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd backend && npm test -- --testPathPattern=profile.service --no-coverage
```
Expected: `Tests: 2 passed, 2 total`

- [ ] **Step 8: Commit**

```bash
git add backend/src/profile/
git commit -m "feat: add ProfileModule with GPT-4o business classifier"
```

---

## Task 5: RagModule

**Files:** `backend/src/rag/rag.service.ts`, `backend/src/rag/rag.service.spec.ts`, `backend/src/rag/rag.module.ts`

- [ ] **Step 1: Write the failing unit test**

Create `backend/src/rag/rag.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { RagService } from './rag.service';
import { PrismaService } from '../database/prisma.service';

const mockEmbed = jest.fn();
jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    embeddings: { create: mockEmbed },
  })),
);

describe('RagService', () => {
  let service: RagService;
  let prisma: { $queryRawUnsafe: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = { $queryRawUnsafe: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<RagService>(RagService);
  });

  it('embed returns a 1536-element number array', async () => {
    const fakeEmbedding = Array(1536).fill(0.1);
    mockEmbed.mockResolvedValue({ data: [{ embedding: fakeEmbedding }] });

    const result = await service.embed('test text');
    expect(result).toHaveLength(1536);
    expect(typeof result[0]).toBe('number');
  });

  it('retrieve returns chunks from pgvector query', async () => {
    const fakeEmbedding = Array(1536).fill(0.1);
    mockEmbed.mockResolvedValue({ data: [{ embedding: fakeEmbedding }] });
    prisma.$queryRawUnsafe.mockResolvedValue([
      {
        id: 'chunk-1',
        text: 'Food establishments in Austin require a permit.',
        source_id: 'src-1',
        source_url: 'https://www.austintexas.gov/department/food-enterprise-permits',
        jurisdiction_tags: ['Austin, TX'],
        industry_tags: ['food_service'],
        activity_tags: ['food_preparation'],
      },
    ]);

    const result = await service.retrieve({
      industry: 'food_service',
      location: 'Austin, TX',
      expansion_locations: [],
      activities: ['food_preparation'],
      employees: null,
    });

    expect(result).toHaveLength(1);
    expect(result[0].source_url).toBe('https://www.austintexas.gov/department/food-enterprise-permits');
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npm test -- --testPathPattern=rag.service --no-coverage
```
Expected: FAIL — `Cannot find module './rag.service'`

- [ ] **Step 3: Write RagService**

Create `backend/src/rag/rag.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../database/prisma.service';
import { BusinessProfile } from '../profile/profile.service';

export interface RegulatoryChunk {
  id: string;
  text: string;
  source_id: string;
  source_url: string;
  jurisdiction_tags: string[];
  industry_tags: string[];
  activity_tags: string[];
}

@Injectable()
export class RagService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  constructor(private prisma: PrismaService) {}

  async embed(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async retrieve(profile: BusinessProfile): Promise<RegulatoryChunk[]> {
    const queryText = [
      profile.industry,
      profile.location,
      ...profile.activities,
      ...profile.expansion_locations,
    ].join(' ');

    const embedding = await this.embed(queryText);
    const embeddingStr = `[${embedding.join(',')}]`;

    const chunks = await this.prisma.$queryRawUnsafe<RegulatoryChunk[]>(
      `SELECT rc.id, rc.text, rc.source_id, rs.source_url,
              rc.jurisdiction_tags, rc.industry_tags, rc.activity_tags
       FROM "RegulatoryChunk" rc
       JOIN "RegulatorySource" rs ON rc.source_id = rs.id
       ORDER BY rc.embedding <=> $1::vector
       LIMIT 10`,
      embeddingStr,
    );

    return chunks;
  }
}
```

- [ ] **Step 4: Write RagModule**

Create `backend/src/rag/rag.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { RagService } from './rag.service';

@Module({
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd backend && npm test -- --testPathPattern=rag.service --no-coverage
```
Expected: `Tests: 2 passed, 2 total`

- [ ] **Step 6: Commit**

```bash
git add backend/src/rag/
git commit -m "feat: add RagModule with OpenAI embeddings and pgvector retrieval"
```

---

## Task 6: RiskModule

**Files:** `backend/src/risk/risk.service.ts`, `backend/src/risk/risk.service.spec.ts`, `backend/src/risk/risk.controller.ts`, `backend/src/risk/dto/analyze-risk.dto.ts`, `backend/src/risk/risk.module.ts`

- [ ] **Step 1: Write the failing unit test**

Create `backend/src/risk/risk.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { RiskService } from './risk.service';
import { PrismaService } from '../database/prisma.service';
import { RagService } from '../rag/rag.service';
import { InternalServerErrorException } from '@nestjs/common';

const mockChatCreate = jest.fn();
jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockChatCreate } },
  })),
);

const fakeChunk = {
  id: 'chunk-1',
  text: 'Food establishments require a Food Enterprise Permit.',
  source_id: 'src-1',
  source_url: 'https://www.austintexas.gov/department/food-enterprise-permits',
  jurisdiction_tags: ['Austin, TX'],
  industry_tags: ['food_service'],
  activity_tags: ['food_preparation'],
};

describe('RiskService', () => {
  let service: RiskService;
  let prisma: {
    business: { create: jest.Mock };
    riskFinding: { createMany: jest.Mock };
  };
  let ragService: { retrieve: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      business: { create: jest.fn().mockResolvedValue({ id: 'biz-001' }) },
      riskFinding: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    ragService = { retrieve: jest.fn().mockResolvedValue([fakeChunk]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskService,
        { provide: PrismaService, useValue: prisma },
        { provide: RagService, useValue: ragService },
      ],
    }).compile();
    service = module.get<RiskService>(RiskService);
  });

  it('returns risk findings with valid source_url', async () => {
    mockChatCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            findings: [{
              risk_level: 'high',
              affected_area: 'Food Service Permit',
              explanation: 'Austin requires a Food Enterprise Permit.',
              recommended_action: 'Apply at Austin Public Health.',
              source_url: 'https://www.austintexas.gov/department/food-enterprise-permits',
            }],
          }),
        },
      }],
    });

    const result = await service.analyze({
      industry: 'food_service',
      location: 'Austin, TX',
      expansion_locations: [],
      activities: ['food_preparation'],
      employees: null,
    });

    expect(result).toHaveLength(1);
    expect(result[0].risk_level).toBe('high');
    expect(result[0].source_url).toMatch(/^https/);
    expect(prisma.riskFinding.createMany).toHaveBeenCalledTimes(1);
  });

  it('strips findings that lack a valid source_url', async () => {
    mockChatCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            findings: [
              {
                risk_level: 'high',
                affected_area: 'Valid Finding',
                explanation: 'Has a source.',
                recommended_action: 'Do something.',
                source_url: 'https://example.com/source',
              },
              {
                risk_level: 'medium',
                affected_area: 'Invalid Finding',
                explanation: 'No source.',
                recommended_action: 'Do something.',
                source_url: '',
              },
            ],
          }),
        },
      }],
    });

    const result = await service.analyze({
      industry: 'food_service',
      location: 'Austin, TX',
      expansion_locations: [],
      activities: [],
      employees: null,
    });

    expect(result).toHaveLength(1);
    expect(result[0].affected_area).toBe('Valid Finding');
  });

  it('throws InternalServerErrorException when all findings lack citations', async () => {
    mockChatCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            findings: [{
              risk_level: 'high',
              affected_area: 'Bad Finding',
              explanation: 'No source.',
              recommended_action: 'Do something.',
              source_url: '',
            }],
          }),
        },
      }],
    });

    await expect(
      service.analyze({
        industry: 'food_service',
        location: 'Austin, TX',
        expansion_locations: [],
        activities: [],
        employees: null,
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npm test -- --testPathPattern=risk.service --no-coverage
```
Expected: FAIL — `Cannot find module './risk.service'`

- [ ] **Step 3: Create the DTO**

Create `backend/src/risk/dto/analyze-risk.dto.ts`:
```typescript
import { IsObject } from 'class-validator';
import { BusinessProfile } from '../../profile/profile.service';

export class AnalyzeRiskDto {
  @IsObject()
  profile: BusinessProfile;
}
```

- [ ] **Step 4: Write RiskService**

Create `backend/src/risk/risk.service.ts`:
```typescript
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../database/prisma.service';
import { RagService, RegulatoryChunk } from '../rag/rag.service';
import { BusinessProfile } from '../profile/profile.service';

export interface RiskFinding {
  risk_level: 'high' | 'medium' | 'low';
  affected_area: string;
  explanation: string;
  recommended_action: string;
  source_url: string;
}

@Injectable()
export class RiskService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  constructor(
    private prisma: PrismaService,
    private ragService: RagService,
  ) {}

  async analyze(profile: BusinessProfile): Promise<RiskFinding[]> {
    const chunks = await this.ragService.retrieve(profile);
    const findings = await this.synthesize(profile, chunks);

    const business = await this.prisma.business.create({
      data: {
        city: profile.location.split(',')[0].trim(),
        state: 'TX',
        industry_code: profile.industry,
        activities: profile.activities,
        expansion_plans: { locations: profile.expansion_locations },
      },
    });

    await this.prisma.riskFinding.createMany({
      data: findings.map((f) => ({
        business_id: business.id,
        risk_level: f.risk_level,
        affected_area: f.affected_area,
        explanation: f.explanation,
        recommended_action: f.recommended_action,
        source_url: f.source_url,
      })),
    });

    return findings;
  }

  private async synthesize(
    profile: BusinessProfile,
    chunks: RegulatoryChunk[],
  ): Promise<RiskFinding[]> {
    const context = chunks
      .map((c) => `SOURCE: ${c.source_url}\n${c.text}`)
      .join('\n\n---\n\n');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a Texas regulatory compliance analyst.
Given a business profile and regulatory source text, identify compliance requirements.

RULES:
- Every finding MUST have a source_url copied exactly from the provided context
- Do NOT invent findings that are not supported by the provided sources
- Return ONLY valid JSON — no markdown, no explanation

Return a JSON object with a "findings" array:
{
  "findings": [{
    "risk_level": "high|medium|low",
    "affected_area": "short label, e.g. Food Service Permit",
    "explanation": "plain-English explanation of what is required",
    "recommended_action": "specific next step the owner should take",
    "source_url": "exact URL from SOURCE: lines in the context"
  }]
}`,
        },
        {
          role: 'user',
          content: `BUSINESS PROFILE:\n${JSON.stringify(profile, null, 2)}\n\nREGULATORY CONTEXT:\n${context}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content!);
    const raw: RiskFinding[] = parsed.findings ?? [];

    const verified = raw.filter(
      (f) => typeof f.source_url === 'string' && f.source_url.startsWith('http'),
    );

    if (verified.length === 0) {
      throw new InternalServerErrorException(
        'No findings could be verified — all lacked valid citations.',
      );
    }

    return verified;
  }
}
```

- [ ] **Step 5: Write RiskController**

Create `backend/src/risk/risk.controller.ts`:
```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { RiskService, RiskFinding } from './risk.service';
import { AnalyzeRiskDto } from './dto/analyze-risk.dto';

@Controller('risk')
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Post('analyze')
  analyze(@Body() dto: AnalyzeRiskDto): Promise<RiskFinding[]> {
    return this.riskService.analyze(dto.profile);
  }
}
```

- [ ] **Step 6: Write RiskModule**

Create `backend/src/risk/risk.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [RagModule],
  controllers: [RiskController],
  providers: [RiskService],
})
export class RiskModule {}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd backend && npm test -- --testPathPattern=risk.service --no-coverage
```
Expected: `Tests: 3 passed, 3 total`

- [ ] **Step 8: Commit**

```bash
git add backend/src/risk/
git commit -m "feat: add RiskModule with RAG pipeline and citation guardrail"
```

---

## Task 7: DiffModule

**Files:** `backend/src/diff/scenarios/scenario-a.json`, `backend/src/diff/diff.service.ts`, `backend/src/diff/diff.service.spec.ts`, `backend/src/diff/diff.controller.ts`, `backend/src/diff/diff.module.ts`

- [ ] **Step 1: Write the failing unit test**

Create `backend/src/diff/diff.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { DiffService } from './diff.service';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';

jest.mock('fs');

describe('DiffService', () => {
  let service: DiffService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiffService],
    }).compile();
    service = module.get<DiffService>(DiffService);
  });

  it('returns parsed scenario data for scenario-a', () => {
    const mockData = {
      scenario: 'scenario-a',
      title: 'Food Truck (Dallas) → Restaurant (Austin)',
      city_a: 'Dallas, TX',
      city_b: 'Austin, TX',
      differences: [
        {
          category: 'Food Service Permit',
          dallas: 'Dallas County permit required.',
          austin: 'Austin Public Health permit required.',
          status: 'changed',
        },
      ],
    };
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockData));

    const result = service.getScenario('scenario-a');
    expect(result.scenario).toBe('scenario-a');
    expect(result.city_a).toBe('Dallas, TX');
    expect(result.differences).toHaveLength(1);
  });

  it('throws NotFoundException for an unknown scenario id', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    expect(() => service.getScenario('scenario-z')).toThrow(NotFoundException);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npm test -- --testPathPattern=diff.service --no-coverage
```
Expected: FAIL — `Cannot find module './diff.service'`

- [ ] **Step 3: Create scenario-a.json**

Create `backend/src/diff/scenarios/scenario-a.json`:
```json
{
  "scenario": "scenario-a",
  "title": "Food Truck (Dallas) → Restaurant + Beer Garden (Austin)",
  "city_a": "Dallas, TX",
  "city_b": "Austin, TX",
  "differences": [
    {
      "category": "Food Service Permit",
      "dallas": "Dallas County Health and Human Services Food Establishment Permit required. Annual renewal.",
      "austin": "Austin Public Health Food Enterprise Permit required. Must pass pre-opening health inspection.",
      "status": "changed",
      "source_a": "https://dallascityhall.com/departments/codecompliance/pages/food-establishments.aspx",
      "source_b": "https://www.austintexas.gov/department/food-enterprise-permits"
    },
    {
      "category": "Alcohol Service (TABC License)",
      "dallas": null,
      "austin": "TABC Mixed Beverage Permit required for beer garden. Approximately $3,000/year. All servers must hold TABC certification.",
      "status": "new",
      "source_a": null,
      "source_b": "https://www.tabc.texas.gov/licenses-permits/license-permit-types/mixed-beverage-permit/"
    },
    {
      "category": "Zoning / Land Use",
      "dallas": "Food trucks operate under a mobile food vendor permit. No fixed-location zoning required.",
      "austin": "Brick-and-mortar restaurant requires CS (Commercial Services) or MU (Mixed Use) zoning. Beer garden requires outdoor seating zoning approval.",
      "status": "changed",
      "source_a": "https://dallascityhall.com/departments/sustainabledevelopment/permit/pages/mobile-food-vendors.aspx",
      "source_b": "https://www.austintexas.gov/page/zoning"
    },
    {
      "category": "Commercial Building Permit",
      "dallas": null,
      "austin": "Commercial Building Permit required for any interior build-out or renovation. Fire marshal inspection required before opening.",
      "status": "new",
      "source_a": null,
      "source_b": "https://www.austintexas.gov/department/building-permits"
    },
    {
      "category": "Sales Tax Permit (Texas Comptroller)",
      "dallas": "Texas Comptroller Sales Tax Permit required — applies statewide.",
      "austin": "No change. Your existing Texas Sales Tax Permit is valid statewide. Update your business address if your principal place of business changes.",
      "status": "same",
      "source_a": "https://comptroller.texas.gov/taxes/sales/",
      "source_b": "https://comptroller.texas.gov/taxes/sales/"
    }
  ]
}
```

- [ ] **Step 4: Write DiffService**

Create `backend/src/diff/diff.service.ts`:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface DiffItem {
  category: string;
  dallas: string | null;
  austin: string | null;
  status: 'new' | 'changed' | 'same';
  source_a: string | null;
  source_b: string | null;
}

export interface ScenarioDiff {
  scenario: string;
  title: string;
  city_a: string;
  city_b: string;
  differences: DiffItem[];
}

@Injectable()
export class DiffService {
  getScenario(scenarioId: string): ScenarioDiff {
    const filePath = path.join(__dirname, 'scenarios', `${scenarioId}.json`);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Scenario '${scenarioId}' not found.`);
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ScenarioDiff;
  }
}
```

- [ ] **Step 5: Write DiffController**

Create `backend/src/diff/diff.controller.ts`:
```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { DiffService, ScenarioDiff } from './diff.service';

@Controller('diff')
export class DiffController {
  constructor(private readonly diffService: DiffService) {}

  @Get(':scenario')
  getScenario(@Param('scenario') scenario: string): ScenarioDiff {
    return this.diffService.getScenario(scenario);
  }
}
```

- [ ] **Step 6: Write DiffModule**

Create `backend/src/diff/diff.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { DiffController } from './diff.controller';
import { DiffService } from './diff.service';

@Module({
  controllers: [DiffController],
  providers: [DiffService],
})
export class DiffModule {}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd backend && npm test -- --testPathPattern=diff.service --no-coverage
```
Expected: `Tests: 2 passed, 2 total`

- [ ] **Step 8: Commit**

```bash
git add backend/src/diff/
git commit -m "feat: add DiffModule with Scenario A static JSON diff"
```

---

## Task 8: App wiring + E2E tests

**Files:** `backend/src/main.ts`, `backend/src/app.module.ts`, `backend/test/profile.e2e-spec.ts`, `backend/test/risk.e2e-spec.ts`, `backend/test/diff.e2e-spec.ts`

- [ ] **Step 1: Delete the default E2E test generated by nest new**

```bash
rm backend/test/app.e2e-spec.ts
```
This file tests a "Hello World" route that no longer exists after we removed the default controller. Leaving it would cause all E2E runs to fail.

- [ ] **Step 2: Write failing E2E tests**

Create `backend/test/profile.e2e-spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProfileService } from '../src/profile/profile.service';

describe('ProfileController (e2e)', () => {
  let app: INestApplication;
  const mockClassify = jest.fn();

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ProfileService)
      .useValue({ classify: mockClassify })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(() => app.close());

  it('POST /api/profile/classify returns 201 with profile', async () => {
    mockClassify.mockResolvedValue({
      industry: 'food_service',
      location: 'Dallas, TX',
      expansion_locations: ['Austin, TX'],
      activities: ['food_preparation'],
      employees: 3,
    });

    return request(app.getHttpServer())
      .post('/api/profile/classify')
      .send({ input: 'I own a food truck in Dallas with 3 employees.' })
      .expect(201)
      .expect((res) => {
        expect(res.body.industry).toBe('food_service');
        expect(res.body.location).toBe('Dallas, TX');
      });
  });

  it('POST /api/profile/classify returns 400 when input is missing', () => {
    return request(app.getHttpServer())
      .post('/api/profile/classify')
      .send({})
      .expect(400);
  });
});
```

Create `backend/test/risk.e2e-spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { RiskService } from '../src/risk/risk.service';

describe('RiskController (e2e)', () => {
  let app: INestApplication;
  const mockAnalyze = jest.fn();

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RiskService)
      .useValue({ analyze: mockAnalyze })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(() => app.close());

  it('POST /api/risk/analyze returns 201 with findings', async () => {
    mockAnalyze.mockResolvedValue([{
      risk_level: 'high',
      affected_area: 'Food Service Permit',
      explanation: 'You need a permit.',
      recommended_action: 'Apply now.',
      source_url: 'https://www.austintexas.gov/department/food-enterprise-permits',
    }]);

    return request(app.getHttpServer())
      .post('/api/risk/analyze')
      .send({
        profile: {
          industry: 'food_service',
          location: 'Austin, TX',
          expansion_locations: [],
          activities: ['food_preparation'],
          employees: null,
        },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].risk_level).toBe('high');
      });
  });

  it('POST /api/risk/analyze returns 400 when profile is missing', () => {
    return request(app.getHttpServer())
      .post('/api/risk/analyze')
      .send({})
      .expect(400);
  });
});
```

Create `backend/test/diff.e2e-spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DiffService } from '../src/diff/diff.service';
import { NotFoundException } from '@nestjs/common';

describe('DiffController (e2e)', () => {
  let app: INestApplication;
  const mockGetScenario = jest.fn();

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DiffService)
      .useValue({ getScenario: mockGetScenario })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(() => app.close());

  it('GET /api/diff/scenario-a returns 200 with diff data', async () => {
    mockGetScenario.mockReturnValue({
      scenario: 'scenario-a',
      title: 'Food Truck → Restaurant',
      city_a: 'Dallas, TX',
      city_b: 'Austin, TX',
      differences: [],
    });

    return request(app.getHttpServer())
      .get('/api/diff/scenario-a')
      .expect(200)
      .expect((res) => {
        expect(res.body.scenario).toBe('scenario-a');
        expect(res.body.city_a).toBe('Dallas, TX');
      });
  });

  it('GET /api/diff/bad-scenario returns 404', () => {
    mockGetScenario.mockImplementation(() => {
      throw new NotFoundException("Scenario 'bad-scenario' not found.");
    });

    return request(app.getHttpServer())
      .get('/api/diff/bad-scenario')
      .expect(404);
  });
});
```

- [ ] **Step 3: Run E2E tests to verify they fail**

Make sure docker is running (`docker ps` should show `civiclens-db` healthy) before running E2E tests — the `DatabaseModule` will attempt to connect.

```bash
cd backend && npm run test:e2e 2>&1 | head -30
```
Expected: FAIL — `Cannot find module '../src/app.module'` or similar import errors.

- [ ] **Step 4: Write app.module.ts**

Replace `backend/src/app.module.ts` entirely:
```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { RagModule } from './rag/rag.module';
import { RiskModule } from './risk/risk.module';
import { DiffModule } from './diff/diff.module';

@Module({
  imports: [
    DatabaseModule,
    ProfileModule,
    RagModule,
    RiskModule,
    DiffModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 5: Write main.ts**

Replace `backend/src/main.ts` entirely:
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`CivicLens API → http://localhost:${port}/api`);
}
bootstrap();
```

- [ ] **Step 6: Run all unit tests**

```bash
cd backend && npm test -- --no-coverage
```
Expected: All unit tests pass (profile.service, rag.service, risk.service, diff.service). No failures.

- [ ] **Step 7: Run E2E tests**

```bash
cd backend && npm run test:e2e
```
Expected: `Test Suites: 3 passed`, `Tests: 6 passed`. If Prisma errors occur in E2E, confirm the database is running (`docker ps`).

- [ ] **Step 8: Smoke test the live server**

```bash
cd backend && npm run start:dev &
sleep 5
curl -s http://localhost:3001/api/diff/scenario-a | head -c 200
```
Expected: JSON with `scenario-a`, `Dallas, TX`, `Austin, TX` visible.

Kill the dev server after confirming: `pkill -f "nest start"` (or Ctrl+C if in foreground).

- [ ] **Step 9: Commit**

```bash
git add backend/src/app.module.ts backend/src/main.ts backend/test/
git commit -m "feat: wire AppModule, add global prefix/CORS/validation, add E2E tests"
```

---

## Task 9: Prisma seed (Scenario A demo data)

**Files:** `backend/prisma/seed.ts`

- [ ] **Step 1: Add seed script to package.json**

Open `backend/package.json`. Inside the top-level object, add:
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```
Also verify `ts-node` is available: `npm list ts-node`. If not installed, run: `npm install -D ts-node`.

- [ ] **Step 2: Write prisma/seed.ts**

Create `backend/prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Scenario A demo data...');

  const business = await prisma.business.upsert({
    where: { id: 'demo-biz-scenario-a' },
    update: {},
    create: {
      id: 'demo-biz-scenario-a',
      name: 'Demo: Food Truck → Austin Restaurant',
      city: 'Dallas',
      state: 'TX',
      industry_code: 'food_service',
      activities: ['food_preparation', 'alcohol_planned', 'outdoor_seating'],
      expansion_plans: { locations: ['Austin, TX'] },
    },
  });

  const findingsData = [
    {
      id: 'finding-001',
      business_id: business.id,
      risk_level: 'high',
      affected_area: 'Austin Food Enterprise Permit',
      explanation:
        'Opening a restaurant in Austin requires a Food Enterprise Permit from Austin Public Health. A pre-opening health inspection must be passed before serving customers.',
      recommended_action:
        'Apply online at austintexas.gov/department/food-enterprise-permits at least 30 days before your planned opening date.',
      source_url: 'https://www.austintexas.gov/department/food-enterprise-permits',
    },
    {
      id: 'finding-002',
      business_id: business.id,
      risk_level: 'high',
      affected_area: 'TABC Mixed Beverage Permit',
      explanation:
        'A beer garden requires a TABC Mixed Beverage Permit. The permit costs approximately $3,000/year. All servers must hold a TABC seller/server certification before serving alcohol.',
      recommended_action:
        'Apply at tabc.texas.gov/licenses-permits. Enroll servers in a TABC-approved certification course before opening.',
      source_url:
        'https://www.tabc.texas.gov/licenses-permits/license-permit-types/mixed-beverage-permit/',
    },
    {
      id: 'finding-003',
      business_id: business.id,
      risk_level: 'high',
      affected_area: 'Austin Zoning – Outdoor Service',
      explanation:
        'A beer garden with outdoor seating requires CS (Commercial Services) or MU (Mixed Use) zoning. Verify the property zoning before signing a lease — incorrect zoning cannot be resolved after the fact.',
      recommended_action:
        'Use the Austin zoning lookup at austintexas.gov/page/zoning before committing to a location.',
      source_url: 'https://www.austintexas.gov/page/zoning',
    },
    {
      id: 'finding-004',
      business_id: business.id,
      risk_level: 'medium',
      affected_area: 'Austin Commercial Building Permit',
      explanation:
        'Any interior build-out or renovation for the new restaurant requires a Commercial Building Permit from Austin Development Services. A fire marshal inspection is required before opening.',
      recommended_action:
        'Submit your building permit application at austintexas.gov/department/building-permits. Budget 4–8 weeks for approval.',
      source_url: 'https://www.austintexas.gov/department/building-permits',
    },
    {
      id: 'finding-005',
      business_id: business.id,
      risk_level: 'low',
      affected_area: 'Texas Sales Tax Permit',
      explanation:
        'Your existing Texas Sales Tax Permit (issued from Dallas) is valid statewide. No new permit is needed for the Austin location.',
      recommended_action:
        'Update your business address with the Texas Comptroller if your principal place of business changes to Austin.',
      source_url: 'https://comptroller.texas.gov/taxes/sales/',
    },
  ];

  for (const finding of findingsData) {
    await prisma.riskFinding.upsert({
      where: { id: finding.id },
      update: {},
      create: finding,
    });
  }

  console.log(`✓ Seeded business: ${business.id}`);
  console.log(`✓ Seeded ${findingsData.length} risk findings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 3: Run the seed**

```bash
cd backend && npx prisma db seed
```
Expected:
```
Seeding Scenario A demo data...
✓ Seeded business: demo-biz-scenario-a
✓ Seeded 5 risk findings
```

- [ ] **Step 4: Verify via Prisma Studio**

```bash
cd backend && npx prisma studio
```
Open `http://localhost:5555`, click `RiskFinding` table — should show 5 rows. Close studio.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/seed.ts backend/package.json
git commit -m "feat: add Prisma seed with Scenario A demo findings"
```

---

## Task 10: Python ingestion pipeline

**Files:** `backend/ingestion/ingest.py`, `backend/ingestion/requirements.txt`, `backend/ingestion/sources.json`

- [ ] **Step 1: Create requirements.txt**

Create `backend/ingestion/requirements.txt`:
```
openai>=1.0.0
langchain-text-splitters>=0.0.1
psycopg2-binary>=2.9.9
requests>=2.31.0
beautifulsoup4>=4.12.0
python-dotenv>=1.0.0
```

- [ ] **Step 2: Create sources.json**

Create `backend/ingestion/sources.json`:
```json
[
  {
    "title": "Texas Licenses & Permits Guide",
    "agency": "Texas.gov",
    "jurisdiction": "Texas",
    "url": "https://www.texas.gov/topics/business/business-licenses-and-permits/",
    "type": "guide",
    "jurisdiction_tags": ["Texas"],
    "industry_tags": ["all"],
    "activity_tags": ["licensing", "permits"]
  },
  {
    "title": "TABC Licensing Requirements",
    "agency": "Texas Alcoholic Beverage Commission",
    "jurisdiction": "Texas",
    "url": "https://www.tabc.texas.gov/licenses-permits/",
    "type": "licensing",
    "jurisdiction_tags": ["Texas"],
    "industry_tags": ["food_service", "retail"],
    "activity_tags": ["alcohol_planned", "alcohol_service"]
  },
  {
    "title": "Austin Development Services – Permits",
    "agency": "City of Austin",
    "jurisdiction": "Austin, TX",
    "url": "https://www.austintexas.gov/department/permits",
    "type": "permits",
    "jurisdiction_tags": ["Austin, TX"],
    "industry_tags": ["all"],
    "activity_tags": ["permits", "construction", "zoning"]
  },
  {
    "title": "Dallas Permits & Licenses",
    "agency": "City of Dallas",
    "jurisdiction": "Dallas, TX",
    "url": "https://dallascityhall.com/departments/sustainabledevelopment/permit/Pages/default.aspx",
    "type": "permits",
    "jurisdiction_tags": ["Dallas, TX"],
    "industry_tags": ["all"],
    "activity_tags": ["permits", "construction", "zoning"]
  },
  {
    "title": "Texas Comptroller – Sales & Use Tax",
    "agency": "Texas Comptroller of Public Accounts",
    "jurisdiction": "Texas",
    "url": "https://comptroller.texas.gov/taxes/sales/",
    "type": "tax",
    "jurisdiction_tags": ["Texas"],
    "industry_tags": ["all"],
    "activity_tags": ["tax", "sales_tax"]
  },
  {
    "title": "Texas Legislature Online – Bill Search",
    "agency": "Texas Legislature",
    "jurisdiction": "Texas",
    "url": "https://legis.state.tx.us/BillSearch/Search.aspx",
    "type": "legislation",
    "jurisdiction_tags": ["Texas"],
    "industry_tags": ["all"],
    "activity_tags": ["legislation", "compliance"]
  }
]
```

- [ ] **Step 3: Create ingest.py**

Create `backend/ingestion/ingest.py`:
```python
"""
One-shot ingestion script: fetch → chunk → embed → store in pgvector.
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
DATABASE_URL = os.environ['DATABASE_URL']
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
        source_id = cur.fetchone()[0]

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
    print(f"  ✓ Done ({len(chunks)} chunks stored)\n")


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
            print(f"  ✗ Failed '{source['title']}': {e}\n", file=sys.stderr)

    conn.close()
    print("Ingestion complete.")


if __name__ == '__main__':
    main()
```

- [ ] **Step 4: Install Python dependencies**

```bash
cd backend/ingestion
pip install -r requirements.txt
```
Expected: All packages install without errors.

- [ ] **Step 5: Dry-run one source to verify pipeline works**

```bash
cd backend/ingestion
python -c "
import os
from dotenv import load_dotenv
load_dotenv('../.env')
from ingest import fetch_text, embed, SPLITTER
text = fetch_text('https://comptroller.texas.gov/taxes/sales/')
chunks = SPLITTER.split_text(text)
print(f'Fetched {len(text)} chars, split into {len(chunks)} chunks')
e = embed(chunks[0])
print(f'Embedding dimension: {len(e)}')
"
```
Expected output like: `Fetched 12345 chars, split into 8 chunks` / `Embedding dimension: 1536`

- [ ] **Step 6: Commit**

```bash
git add backend/ingestion/
git commit -m "feat: add Python ingestion pipeline for regulatory sources"
```

---

## Task 11: Frontend placeholder

**Files:** `frontend/placeholder.md`

- [ ] **Step 1: Create frontend folder and placeholder**

```bash
mkdir frontend
```

Create `frontend/placeholder.md`:
```markdown
# CivicLens Frontend

**Stack:** Next.js 14 + React 18 + Tailwind CSS  
**Deployment:** Vercel

## Planned pages

- `/` — Landing page with pitch + business intake form
- `/dashboard` — Risk findings dashboard (risk score, citations, next steps)
- `/diff/[scenario]` — Side-by-side regulatory diff viewer
- `/pulse` — Compliance Pulse email mockup (static HTML preview)

## API endpoints consumed

- `POST /api/profile/classify` — Classify business from natural language input
- `POST /api/risk/analyze` — Get risk findings for a business profile
- `GET /api/diff/scenario-a` — Load Scenario A diff data

## Setup (when ready to implement)

```bash
npx create-next-app@14 . --typescript --tailwind --app --src-dir
```
```

- [ ] **Step 2: Commit**

```bash
git add frontend/
git commit -m "chore: add frontend placeholder for Next.js app"
```

---

## Final verification

- [ ] **Run full test suite**

```bash
cd backend && npm test -- --no-coverage && npm run test:e2e
```
Expected: All unit + E2E tests green.

- [ ] **Start the server and hit all three endpoints**

```bash
cd backend && npm run start:dev &
sleep 5

# Profile classify
curl -s -X POST http://localhost:3001/api/profile/classify \
  -H "Content-Type: application/json" \
  -d '{"input":"I own a food truck in Dallas and want to open a restaurant in Austin with a beer garden."}' \
  | python -m json.tool

# Diff endpoint (no OpenAI needed)
curl -s http://localhost:3001/api/diff/scenario-a | python -m json.tool
```
Expected: Profile endpoint returns `{ industry: "food_service", ... }`. Diff endpoint returns the 5-item differences array.

- [ ] **Final commit**

```bash
git add -A
git commit -m "chore: CivicLens backend complete — all modules, tests, seed, ingestion"
```
