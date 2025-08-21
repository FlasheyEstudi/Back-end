import { Module } from '@nestjs/common';
import { TipoPagoController } from './TipoPago.controller'; // Asegúrate que el nombre sea el que usas
import { TipoPagoService } from './TipoPago.service';
import { SqlService } from '../../ms/cnxjs/sql.service'; // Asegúrate de que esta ruta sea correcta
import { AuthModule } from '../../auth/auth.module'; // Importa AuthModule para JwtAuthGuard

@Module({
  imports: [AuthModule], // Añade AuthModule aquí
  controllers: [TipoPagoController],
  providers: [TipoPagoService, SqlService],
  exports: [TipoPagoService] // Para que otros módulos puedan usar TipoPagoService
})
export class TipoPagoModule {}
