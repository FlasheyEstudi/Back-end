import { Module } from '@nestjs/common';
import { SolicitudBecaController } from './SolicitudBeca.controller';
import { SolicitudBecaService } from './SolicitudBeca.service';
import { SqlService } from '../../ms/cnxjs/sql.service';
// ¡IMPORTANTE! Asegúrate de que esta ruta sea correcta para tu AuthModule
import { AuthModule } from '../../auth/auth.module'; // Asumiendo que tienes un AuthModule que exporta JwtAuthGuard's dependencies

@Module({
  imports: [
    AuthModule, // <-- ¡Este es el cambio clave! Importa tu módulo de autenticación aquí.
    // Si tu AuthModule no exporta JwtModule, podrías necesitar importar JwtModule directamente aquí también:
    // JwtModule.register({ /* opciones de JWT */ }),
  ],
  controllers: [SolicitudBecaController],
  providers: [
    SolicitudBecaService,
    SqlService // Asegúrate de que SqlService esté en los providers si es usado por SolicitudBecaService
  ],
  exports: [SolicitudBecaService],
})
export class SolicitudBecaModule {}
