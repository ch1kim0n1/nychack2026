import { Body, Controller, Post } from '@nestjs/common';
import { DraftService, DraftResult } from './draft.service';
import { CreateDraftDto } from './dto/create-draft.dto';

@Controller('draft')
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  @Post()
  generate(@Body() dto: CreateDraftDto): Promise<DraftResult> {
    return this.draftService.generate(dto);
  }
}
