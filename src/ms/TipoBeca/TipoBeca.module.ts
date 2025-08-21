import { Module } from '@nestjs/common';
import { TipoBecaController } from './TipoBeca.controller';
import { TipoBecaService } from './TipoBeca.service';
import { SqlService } from '../../ms/cnxjs/sql.service'; // Asegúrate de que esta ruta sea correcta

@Module({
  controllers: [TipoBecaController],
  providers: [TipoBecaService, SqlService],
  exports: [TipoBecaService] // Para que otros módulos puedan usar TipoBecaService
})
export class TipoBecaModule {}
