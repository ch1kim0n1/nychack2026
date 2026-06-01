import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DraftService, DraftResult } from './draft.service';
import { CreateDraftDto } from './dto/create-draft.dto';

@Controller('draft')
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post()
  generate(@Body() dto: CreateDraftDto): Promise<DraftResult> {
    return this.draftService.generate(dto);
  }
}
