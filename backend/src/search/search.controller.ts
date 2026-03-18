import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { RoleEnum } from 'src/modules/roles/enums/roles.enum';
import { RolesGuard } from 'src/core/guards/roles.guard';

@ApiTags('Search')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR, RoleEnum.NURSE)
  @ApiOperation({ summary: 'Busca global de pacientes, médicos e agendamentos (BFF)' })
  async searchAll(@Query('q') q: string) {
    return this.searchService.globalSearch(q);
  }
}