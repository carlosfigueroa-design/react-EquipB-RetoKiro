import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AliadoTypeDto {
  INTERMEDIARIO = 'INTERMEDIARIO',
  FINTECH = 'FINTECH',
  BANCO = 'BANCO',
  ECOMMERCE = 'ECOMMERCE',
  DESARROLLADOR = 'DESARROLLADOR',
}

export class RegisterAliadoDto {
  @ApiProperty({ example: 'dev@fintech.co' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'FinTech Colombia SAS' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: '900123456-7' })
  @IsString()
  @IsNotEmpty()
  nit: string;

  @ApiProperty({ enum: AliadoTypeDto, example: 'FINTECH' })
  @IsEnum(AliadoTypeDto)
  type: AliadoTypeDto;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiProperty({ example: '+57 310 1234567' })
  @IsString()
  @IsNotEmpty()
  contactPhone: string;
}
