// src/ms/DetallePago/DetallePago.module.ts
import { Module } from '@nestjs/common';
import { DetallePagoController } from './DetallePago.controller';
import { DetallePagoService } from './DetallePago.service';
import { CnxjsModule } from '../cnxjs/cnxjs.module'; // ✅ Importa CnxjsModule
import { AuthModule } from '../../auth/auth.module'; // ✅ Importa AuthModule

@Module({
  imports: [CnxjsModule, AuthModule], // ✅ Agrega ambos módulos
  controllers: [DetallePagoController],
  providers: [DetallePagoService],
})
export class DetallePagoModule {}