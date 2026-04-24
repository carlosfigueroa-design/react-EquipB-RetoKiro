import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({
    description: 'Email del usuario para enviar el OTP',
    example: 'aliado@empresa.com',
  })
  @IsEmail({}, { message: 'El email proporcionado no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email!: string;
}
