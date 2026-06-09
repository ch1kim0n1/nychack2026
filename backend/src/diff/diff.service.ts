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

export interface ScenarioMeta {
  id: string;
  title: string;
  city_a: string;
  city_b: string;
}

const SCENARIOS_DIR = path.join(__dirname, 'scenarios');

const VALID_SCENARIOS = new Set([
  'scenario-a',
  'scenario-b',
  'scenario-c',
  'temporal-tabc-2026',
]);

@Injectable()
export class DiffService {
  getScenarioList(): ScenarioMeta[] {
    const list: ScenarioMeta[] = [];
    for (const scenarioId of VALID_SCENARIOS) {
      const filePath = path.join(SCENARIOS_DIR, `${scenarioId}.json`);
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(
          fs.readFileSync(filePath, 'utf-8'),
        ) as ScenarioDiff;
        list.push({
          id: scenarioId,
          title: data.title,
          city_a: data.city_a,
          city_b: data.city_b,
        });
      }
    }
    return list;
  }

  getScenario(scenarioId: string): ScenarioDiff {
    if (!VALID_SCENARIOS.has(scenarioId)) {
      throw new NotFoundException(`Scenario '${scenarioId}' not found.`);
    }

    const filePath = path.join(SCENARIOS_DIR, `${scenarioId}.json`);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Scenario '${scenarioId}' not found.`);
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ScenarioDiff;
  }
}
