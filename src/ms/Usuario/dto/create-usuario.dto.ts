import { IsString, IsOptional, IsInt, IsEmail, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @IsInt()
  @IsOptional()
  Id?: number;

  @IsString()
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  Nombre: string;

  

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  Contrasena: string;

  @IsString()
  @IsOptional()
  Apellidos?: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsOptional()
  Correo?: string;

  @IsString()
  @IsOptional()
  Role?: string;
}