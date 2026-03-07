import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'João Silva Atualizado' })
  name?: string;

  @ApiPropertyOptional({ example: 'uuid-do-novo-cargo' })
  role_id?: string;
}