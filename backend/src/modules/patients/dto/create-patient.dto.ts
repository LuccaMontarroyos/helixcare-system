import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ContactInfoDto {
  @ApiProperty({ example: '81999999999' })
  phone: string;
  @ApiProperty({ example: 'Maria (Mãe)' })
  emergency_contact: string;
  @ApiProperty({ example: '81988888888' })
  emergency_phone: string;
}

class AddressDto {
  @ApiPropertyOptional({ example: '50000-000' })
  zip_code?: string;
  @ApiPropertyOptional({ example: 'Rua das Graças' })
  street?: string;
  @ApiPropertyOptional({ example: '123' })
  number?: string;
  @ApiPropertyOptional({ example: 'Recife' })
  city?: string;
  @ApiPropertyOptional({ example: 'PE' })
  state?: string;
}

export class CreatePatientDto {
  @ApiProperty({ example: 'Carlos Eduardo Silva' })
  name: string;

  @ApiProperty({ example: '12345678901', description: 'Apenas números' })
  cpf: string;

  @ApiProperty({ example: '1985-08-20', description: 'Formato YYYY-MM-DD' })
  birth_date: string;

  @ApiPropertyOptional({ example: 'Masculino' })
  gender?: string;

  @ApiPropertyOptional({ example: 'O+' })
  blood_type?: string;

  @ApiPropertyOptional({ example: 'Alergia a Penicilina e Dipirona' })
  allergies?: string;

  @ApiProperty({ type: ContactInfoDto })
  contact_info: ContactInfoDto;

  @ApiPropertyOptional({ type: AddressDto })
  address?: AddressDto;
}