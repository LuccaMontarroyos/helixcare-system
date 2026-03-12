import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async searchAll(@Query('q') q: string) {
    return this.searchService.globalSearch(q);
  }
}