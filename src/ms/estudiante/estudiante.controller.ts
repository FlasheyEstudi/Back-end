import { 
  Controller, Post, Body, Get, Param, Delete, Query, Logger, NotFoundException, ValidationPipe, UseGuards 
} from '@nestjs/common';
import { EstudianteService } from './estudiante.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { SqlService } from '../cnxjs/sql.service';
import { JwtAuthGuard } from '../../auth/jwt-auth-guard';

@Controller('estudiante')
@UseGuards(JwtAuthGuard) // 🔐 Protege todas las rutas con JWT
export class EstudianteController {
  private readonly logger = new Logger(EstudianteController.name);

  constructor(
    private readonly estudianteService: EstudianteService,
    private readonly sqlService: SqlService
  ) {}

  // Crear estudiante
  @Post()
  async create(@Body(new ValidationPipe({ transform: true })) dto: CreateEstudianteDto) {
    this.logger.log('Creando estudiante: ' + JSON.stringify(dto));
    return await this.estudianteService.create(dto);
  }

  // Obtener todos los estudiantes
  @Get()
  async findAll() {
    this.logger.log('Obteniendo todos los estudiantes');
    return await this.estudianteService.findAll();
  }

  // Endpoint temporal para detalles adicionales
  @Get('detalle')
  async getDetalle() {
    this.logger.log('Obteniendo detalles de estudiantes');
    const result = await this.estudianteService.findAll(); // Temporalmente usa findAll
    return result.map(est => ({
      ...est,
      becas: 0,      // Placeholder
      MontoTotal: 0, // Placeholder
    }));
  }

  // NUEVO ENDPOINT: Mapea usuario ID a estudiante ID
  @Get('mapa-id')
  async mapUserToEstudiante(@Query('userId') userId: string) {
    this.logger.log('Mapeando userId: ' + userId);

    if (!userId || isNaN(Number(userId)) || Number(userId) <= 0) {
      throw new NotFoundException('userId inválido');
    }

    const pool = await this.sqlService.getConnection();
    const result = await pool.request()
      .input('UserId', Number(userId))
      .execute('Beca.sp_Map_UserToEstudiante');

    const estudianteId = result.recordset?.[0]?.EstudianteId;
    if (!estudianteId) {
      throw new NotFoundException('No se encontró un estudiante asociado al userId');
    }

    return { estudianteId };
  }

  // Obtener un estudiante por ID (ruta dinámica al final)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log('Obteniendo estudiante ID: ' + id);
    const numId = Number(id);
    if (isNaN(numId) || numId <= 0) {
      throw new NotFoundException('ID inválido');
    }
    try {
      return await this.estudianteService.findOne(numId);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Error interno al buscar estudiante: ${error.message}`);
    }
  }

  // Eliminar estudiante
  @Delete(':id')
  async remove(@Param('id') id: string) {
    this.logger.log('Eliminando estudiante ID: ' + id);
    const numId = Number(id);
    if (isNaN(numId) || numId <= 0) {
      throw new NotFoundException('ID inválido');
    }
    return await this.estudianteService.remove(numId);
  }
}
