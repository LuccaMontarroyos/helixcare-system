import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiPropertyOptional({
    example: false,
    description: 'Quando true, força criação de uma nova sessão de checkout.',
  })
  force_refresh?: boolean;
}
