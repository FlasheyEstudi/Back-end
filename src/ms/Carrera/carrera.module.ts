import { Module } from '@nestjs/common';
import { CarreraController } from './carrera.controller';
import { CarreraService } from './carrera.service';
import { SqlService } from '../cnxjs/sql.service';

@Module({
  controllers: [CarreraController],
  providers: [CarreraService, SqlService],
})
export class CarreraModule {}
