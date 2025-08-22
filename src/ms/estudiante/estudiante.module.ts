import { Module } from '@nestjs/common';
import { EstudianteController } from './estudiante.controller';
import { EstudianteService } from './estudiante.service';
import { SqlService } from '../cnxjs/sql.service';
import { AuthModule } from '../../auth/auth.module'; // Importar AuthModule

@Module({
  imports: [AuthModule], // Agregar AuthModule
  controllers: [EstudianteController],
  providers: [EstudianteService, SqlService]
})
export class EstudianteModule {}