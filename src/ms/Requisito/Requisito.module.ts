import { Module } from '@nestjs/common';
import { RequisitoController } from './Requisito.controller';
import { RequisitoService } from './Requisito.service';
import { SqlService } from '../../ms/cnxjs/sql.service'; // Asegúrate de que esta ruta sea correcta

@Module({
  controllers: [RequisitoController],
  providers: [RequisitoService, SqlService],
  // Si necesitas que RequisitoService sea accesible desde otros módulos, añádelo a 'exports'
  exports: [RequisitoService]
})
export class RequisitoModule {}
