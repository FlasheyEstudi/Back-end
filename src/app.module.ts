import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

// Módulos de tu aplicación
import { AreaConocimientoModule } from './ms/AreaConocimiento/AreaConocimiento.module';
import { CarreraModule } from './ms/Carrera/carrera.module';
import { CnxjsModule } from './ms/cnxjs/cnxjs.module';
import { DetallePagoModule } from './ms/DetallePago/DetallePago.module';
import { Detalle_requisitos_becaModule } from './ms/Detalle_requisitos-beca/Detalle_requisitos_beca.module';
import { EstadoModule } from './ms/Estado/Estado.module';
import { EstudianteModule } from './ms/estudiante/estudiante.module';
import { PeriodoAcademicoModule } from './ms/PeriodicoAcademico/PeriodoAcademico.module';
import { RequisitoModule } from './ms/Requisito/Requisito.module';
import { ReporteModule } from './ms/Reporte/reporte.module';
import { SolicitudBecaModule } from './ms/SolicitudBeca/SolicitudBeca.module';
import { TipoBecaModule } from './ms/TipoBeca/TipoBeca.module';
import { TipoPagoModule } from './ms/TipoPago/TipoPago.module';
import { UsuarioModule } from './ms/Usuario/usuario.module';

// Módulo de autenticación
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CnxjsModule,
    AreaConocimientoModule,
    CarreraModule,
    DetallePagoModule,
    Detalle_requisitos_becaModule,
    EstadoModule,
    EstudianteModule,
    PeriodoAcademicoModule,
    RequisitoModule,
    ReporteModule,
    SolicitudBecaModule,
    TipoBecaModule,
    TipoPagoModule,
    UsuarioModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}