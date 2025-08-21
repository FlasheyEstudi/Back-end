import { Module } from '@nestjs/common';
import { ReporteController } from './reporte.controller';
import { ReporteService } from './reporte.service';
import { SqlService } from '../../ms/cnxjs/sql.service'; // Asegúrate de que esta ruta sea correcta
import { AuthModule } from '../../auth/auth.module'; // Importa AuthModule

@Module({
  imports: [AuthModule], // Añade AuthModule aquí para que sus proveedores estén disponibles
  controllers: [ReporteController],
  providers: [ReporteService, SqlService],
  exports: [ReporteService] // Exporta el servicio si otros módulos lo van a inyectar
})
export class ReporteModule {}
