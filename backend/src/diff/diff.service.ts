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
