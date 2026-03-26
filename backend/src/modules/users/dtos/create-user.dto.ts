import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Dra. Ana Silva' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ana@helixcare.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SenhaForte123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'CRM 12345-PE' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({ example: '(81) 99999-9999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Cardiologista' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}