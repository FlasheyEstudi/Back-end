import { Module } from '@nestjs/common';
import { PeriodoAcademicoController } from './PeriodoAcademico.controller';
import { PeriodoAcademicoService } from './PeriodoAcademico.service';
import { SqlService } from '../../ms/cnxjs/sql.service'; // Asegúrate de que esta ruta sea correcta

@Module({
  controllers: [PeriodoAcademicoController],
  providers: [PeriodoAcademicoService, SqlService],
  exports: [PeriodoAcademicoService] // Para que otros módulos puedan usar PeriodoAcademicoService
})
export class PeriodoAcademicoModule {}
