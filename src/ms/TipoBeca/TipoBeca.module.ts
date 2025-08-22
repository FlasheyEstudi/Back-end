// src/app/ms/TipoBeca/TipoBeca.module.ts
import { Module } from '@nestjs/common';
import { TipoBecaController } from './TipoBeca.controller';
import { TipoBecaService } from './TipoBeca.service';
import { SqlService } from '../../ms/cnxjs/sql.service';
import { AuthModule } from '../../auth/auth.module'; // Ajusta la ruta según tu estructura

@Module({
  imports: [
    AuthModule, // Importar el módulo de autenticación
  ],
  controllers: [TipoBecaController],
  providers: [TipoBecaService, SqlService],
  exports: [TipoBecaService]
})
export class TipoBecaModule {}