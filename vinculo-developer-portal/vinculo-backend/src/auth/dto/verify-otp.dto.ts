import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'aliado@empresa.com',
  })
  @IsEmail({}, { message: 'El email proporcionado no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email!: string;

  @ApiProperty({
    description: 'Código OTP de 6 dígitos',
    example: '123456',
  })
  @IsString({ message: 'El OTP debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El OTP es requerido' })
  @Length(6, 6, { message: 'El OTP debe tener exactamente 6 dígitos' })
  @Matches(/^\d{6}$/, { message: 'El OTP debe contener solo dígitos numéricos' })
  otp!: string;
}
