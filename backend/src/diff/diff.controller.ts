import { Controller, Get, Param } from '@nestjs/common';
import { DiffService, ScenarioDiff, ScenarioMeta } from './diff.service';

@Controller('diff')
export class DiffController {
  constructor(private readonly diffService: DiffService) {}

  @Get()
  getScenarioList(): ScenarioMeta[] {
    return this.diffService.getScenarioList();
  }

  @Get(':scenario')
  getScenario(@Param('scenario') scenario: string): ScenarioDiff {
    return this.diffService.getScenario(scenario);
  }
}
