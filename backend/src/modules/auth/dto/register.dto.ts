import { IsEmail, IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva', description: 'Nome completo do usuário' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'joao@helixcare.com', description: 'E-mail corporativo ou pessoal' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SenhaForte123!', description: 'Mínimo 8 caracteres' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  password: string;

  @ApiProperty({ example: 'uuid-do-cargo-admin', description: 'ID da tabela roles' })
  @IsUUID('4', { message: 'O ID do cargo deve ser um UUID válido' })
  @IsNotEmpty()
  role_id: string;
}