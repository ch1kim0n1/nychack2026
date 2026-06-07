import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { WatchlistService, SavedProfile } from './watchlist.service';
import { CreateWatchlistDto, DeleteWatchlistDto } from './dto/watchlist.dto';

@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post()
  save(@Body() dto: CreateWatchlistDto): Promise<SavedProfile> {
    return this.watchlistService.save({
      client_id: dto.client_id,
      label: dto.label,
      profile: dto.profile,
    });
  }

  @Get()
  list(@Query('client_id') clientId: string): Promise<SavedProfile[]> {
    return this.watchlistService.list(clientId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Body() dto: DeleteWatchlistDto,
  ): Promise<void> {
    return this.watchlistService.remove(id, dto.client_id);
  }
}
