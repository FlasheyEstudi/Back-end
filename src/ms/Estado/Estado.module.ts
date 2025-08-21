import { Module } from '@nestjs/common';
import { EstadoController } from './Estado.controller';
import { EstadoService } from './Estado.service';
import { SqlService } from '../../ms/cnxjs/sql.service'; // Asegúrate de que esta ruta sea correcta

@Module({
  controllers: [EstadoController],
  providers: [EstadoService, SqlService],
  exports: [EstadoService] // Para que otros módulos puedan usar EstadoService
})
export class EstadoModule {}
