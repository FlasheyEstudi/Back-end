// src/ms/DetallePago/DetallePago.service.ts
import { Injectable, Logger, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { SqlService } from '../../ms/cnxjs/sql.service';
import { CreateDetallePagoDto } from './dto/create-DetallePago.dto';

// Interfaces existentes (mantener tal cual)
export interface DetallePagoResponse {
  Id: number;
  SolicitudBecaId: number;
  TipoPagoId: number;
  Monto: number;
  FechaPago: Date;
  Referencia?: string | null;
  EstadoId: number;
  SolicitudBecaReferencia?: string | null;
  TipoPagoNombre?: string | null;
  Estadonombre?: string | null;
}

export interface SolicitudBecaLookup {
  Id: number;
  Referencia: string;
}

export interface TipoPagoLookup {
  Id: number;
  Nombre: string;
}

export interface EstadoLookup {
  Id: number;
  Nombre: string;
}

@Injectable()
export class DetallePagoService {
  private readonly logger = new Logger(DetallePagoService.name);
  
  constructor(private readonly sqlService: SqlService) {}

  // === Métodos existentes (mantener tal cual) === //
  async create(dto: CreateDetallePagoDto): Promise<DetallePagoResponse> {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      const isUpdate = dto.Id && dto.Id > 0;
      const detallePagoIdForSp = isUpdate ? dto.Id : 0;
      request.input('Id', detallePagoIdForSp);
      request.input('SolicitudBecaId', dto.SolicitudBecaId);
      request.input('TipoPagoId', dto.TipoPagoId);
      request.input('Monto', dto.Monto);
      request.input('FechaPago', new Date(dto.FechaPago));
      request.input('Referencia', dto.Referencia ?? null);
      request.input('EstadoId', dto.EstadoId);
      const result: any = await request.execute('Beca.sp_Save_DetallePago');
      const newId = result.recordset?.[0]?.NewId || result.recordset?.[0]?.UpdatedId || detallePagoIdForSp;
      if (!newId && !isUpdate) throw new Error('No se devolvió un NewId válido.');
      return await this.findOne(newId);
    } catch (error: any) {
      this.logger.error(`Error al guardar Detalle de Pago: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error interno al guardar Detalle de Pago.',
        technical: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: number, dto: CreateDetallePagoDto): Promise<DetallePagoResponse> {
    dto.Id = id;
    return this.create(dto);
  }

  async findAll(): Promise<DetallePagoResponse[]> {
    try {
      const pool = await this.sqlService.getConnection();
      const result: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_DetallePago');
      const detallesDePago = result.recordset;
      const [solicitudes, tiposPago, estados] = await Promise.all([
        this.getAllSolicitudBecasLookup(),
        this.getAllTipoPagosLookup(),
        this.getAllEstadosLookup(),
      ]);
      return detallesDePago.map((dp: any) => ({
        ...dp,
        FechaPago: new Date(dp.FechaPago),
        SolicitudBecaReferencia: solicitudes.find(s => s.Id === dp.SolicitudBecaId)?.Referencia ?? null,
        TipoPagoNombre: tiposPago.find(tp => tp.Id === dp.TipoPagoId)?.Nombre ?? null,
        Estadonombre: estados.find(e => e.Id === dp.EstadoId)?.Nombre ?? null,
      }));
    } catch (error: any) {
      this.logger.error(`Error al obtener todos los Detalles de Pago: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al obtener los Detalles de Pago.',
        technical: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number): Promise<DetallePagoResponse> {
    try {
      const pool = await this.sqlService.getConnection();
      const result: any = await pool.request().input('Id', id).execute('Beca.sp_Get_DetallePago');
      if (!result.recordset.length) throw new NotFoundException(`Detalle de Pago con ID ${id} no encontrado.`);
      const detallePago = result.recordset[0];
      const [solicitud, tipoPago, estado] = await Promise.all([
        this.getSolicitudBecaNameById(detallePago.SolicitudBecaId),
        this.getTipoPagoNameById(detallePago.TipoPagoId),
        this.getEstadoNameById(detallePago.EstadoId),
      ]);
      return { 
        ...detallePago, 
        FechaPago: new Date(detallePago.FechaPago), 
        SolicitudBecaReferencia: solicitud, 
        TipoPagoNombre: tipoPago, 
        Estadonombre: estado 
      };
    } catch (error: any) {
      this.logger.error(`Error al buscar Detalle de Pago por ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: `Error al buscar el Detalle de Pago con ID ${id}.`,
        technical: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(id: number): Promise<{ mensaje: string }> {
    try {
      const pool = await this.sqlService.getConnection();
      const result = await pool.request().input('Id', id).execute('Beca.sp_Delete_DetallePago');
      if (result.rowsAffected[0] === 0) throw new NotFoundException(`Detalle de Pago con ID ${id} no encontrado.`);
      return { mensaje: `Detalle de Pago con ID ${id} eliminado correctamente` };
    } catch (error: any) {
      this.logger.error(`Error al eliminar Detalle de Pago ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al eliminar el Detalle de Pago.',
        technical: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getSolicitudBecaNameById(id: number | null): Promise<string | null> {
    if (!id) return null;
    const solicitudes = await this.getAllSolicitudBecasLookup();
    return solicitudes.find(s => s.Id === id)?.Referencia ?? null;
  }

  private async getTipoPagoNameById(id: number | null): Promise<string | null> {
    if (!id) return null;
    const tipos = await this.getAllTipoPagosLookup();
    return tipos.find(t => t.Id === id)?.Nombre ?? null;
  }

  private async getEstadoNameById(id: number | null): Promise<string | null> {
    if (!id) return null;
    const estados = await this.getAllEstadosLookup();
    return estados.find(e => e.Id === id)?.Nombre ?? null;
  }

  async getAllSolicitudBecasLookup(): Promise<SolicitudBecaLookup[]> {
    const pool = await this.sqlService.getConnection();
    const result: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_SolicitudBeca');
    return result.recordset.map((s: any) => ({ Id: s.Id, Referencia: s.Referencia || `Solicitud #${s.Id}` }));
  }

  async getAllTipoPagosLookup(): Promise<TipoPagoLookup[]> {
    const pool = await this.sqlService.getConnection();
    const result: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_TipoPago');
    return result.recordset.map((tp: any) => ({ Id: tp.Id, Nombre: tp.Nombre }));
  }

  async getAllEstadosLookup(): Promise<EstadoLookup[]> {
    const pool = await this.sqlService.getConnection();
    const result: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_Estado');
    return result.recordset.map((e: any) => ({ Id: e.Id, Nombre: e.Nombre }));
  }

  // ✅ NUEVOS MÉTODOS PARA IMPLEMENTAR EL DASHBOARD === //

  /**
   * Método para obtener datos resumen del dashboard
   * Obtiene totales de pagos, beneficiarios activos y presupuesto total
   */
  async getDashboardSummary(): Promise<{
    totalPagado: number;
    totalPendiente: number;
    beneficiariosActivos: number;
    presupuestoTotal: number;
  }> {
    try {
      const pool = await this.sqlService.getConnection();
      
      // Obtener todos los detalles de pago para calcular totales
      const detalles = await this.findAll();
      
      // Calcular totales
      const totalPagado = detalles
        .filter(d => d.EstadoId === 1) // Estado = Pagado (ajustar según tu lógica)
        .reduce((sum, d) => sum + d.Monto, 0);
        
      const totalPendiente = detalles
        .filter(d => d.EstadoId === 2) // Estado = Pendiente (ajustar según tu lógica)
        .reduce((sum, d) => sum + d.Monto, 0);
        
      const presupuestoTotal = detalles.reduce((sum, d) => sum + d.Monto, 0);
      
      // Contar beneficiarios únicos (solicitudes de beca distintas)
      const beneficiariosActivos = [...new Set(detalles.map(d => d.SolicitudBecaId))].length;
      
      return {
        totalPagado,
        totalPendiente,
        beneficiariosActivos,
        presupuestoTotal
      };
    } catch (error: any) {
      this.logger.error(`Error al obtener resumen del dashboard: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al obtener datos resumen del dashboard.',
        technical: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Método para obtener el control de pagos (tabla principal)
   * Muestra información de pagos por beneficiario
   */
  async getControlDePagos(): Promise<any[]> {
    try {
      const pool = await this.sqlService.getConnection();
      
      // Primero obtenemos los detalles de pago
      const detalles = await this.findAll();
      
      // Luego obtenemos las solicitudes de beca para hacer el lookup
      const solicitudes = await this.getAllSolicitudBecasLookup();
      const tiposPago = await this.getAllTipoPagosLookup();
      
      // Procesar los datos para la tabla de control de pagos
      const result = detalles.map(d => {
        const solicitud = solicitudes.find(s => s.Id === d.SolicitudBecaId);
        const tipoPago = tiposPago.find(tp => tp.Id === d.TipoPagoId);
        
        return {
          Id: d.Id,
          Beneficiario: solicitud?.Referencia || 'Desconocido',
          Beca: tipoPago?.Nombre || 'Sin nombre',
          MontoTotal: d.Monto,
          Pagado: d.EstadoId === 1 ? d.Monto : 0, // Ajustar según tu lógica de estados
          Restante: d.EstadoId === 2 ? d.Monto : 0, // Ajustar según tu lógica de estados
          ProximoPago: d.FechaPago,
          Estado: d.EstadoId === 1 ? 'Completado' : d.EstadoId === 2 ? 'Pendiente' : 'Activo'
        };
      });
      
      return result;
    } catch (error: any) {
      this.logger.error(`Error al obtener control de pagos: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al obtener datos del control de pagos.',
        technical: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Método para obtener el calendario de pagos
   * Agrupa pagos por fecha
   */
  async getCalendarioDePagos(): Promise<any[]> {
    try {
      const pool = await this.sqlService.getConnection();
      
      // Obtener todos los detalles de pago
      const detalles = await this.findAll();
      
      // Luego obtenemos las solicitudes de beca para hacer el lookup
      const solicitudes = await this.getAllSolicitudBecasLookup();
      
      // Agrupar por fecha
      const byDate = new Map<string, any>();
      
      detalles.forEach(d => {
        // Convertir la fecha a formato de día (YYYY-MM-DD)
        const dateStr = new Date(d.FechaPago).toISOString().split('T')[0];
        const existing = byDate.get(dateStr) || { 
          fecha: dateStr, 
          pagos: [] 
        };
        
        const solicitud = solicitudes.find(s => s.Id === d.SolicitudBecaId);
        
        existing.pagos.push({
          id: d.Id,
          nombre: solicitud?.Referencia || 'Desconocido',
          monto: d.Monto,
          estado: d.EstadoId === 1 ? 'Pagado' : 'Programado' // Ajustar según tu lógica de estados
        });
        
        byDate.set(dateStr, existing);
      });
      
      // Convertir a array y ordenar por fecha
      return Array.from(byDate.values()).sort((a, b) => 
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );
    } catch (error: any) {
      this.logger.error(`Error al obtener calendario de pagos: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al obtener datos del calendario de pagos.',
        technical: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Método para obtener el historial de transacciones
   * Muestra todas las transacciones realizadas
   */
  async getHistorialTransacciones(): Promise<any[]> {
    try {
      const pool = await this.sqlService.getConnection();
      
      // Obtener todos los detalles de pago
      const detalles = await this.findAll();
      
      // Luego obtenemos las solicitudes de beca para hacer el lookup
      const solicitudes = await this.getAllSolicitudBecasLookup();
      
      // Procesar datos para el historial
      return detalles
        .map(d => {
          const solicitud = solicitudes.find(s => s.Id === d.SolicitudBecaId);
          
          return {
            id: d.Id,
            nombre: solicitud?.Referencia || 'Desconocido',
            fecha: d.FechaPago,
            monto: d.Monto,
            metodo: 'Transferencia', // Puedes ajustar esto si tienes más métodos de pago
            estado: d.EstadoId === 1 ? 'Pagado' : 'Pendiente' // Ajustar según tu lógica de estados
          };
        })
        .sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
    } catch (error: any) {
      this.logger.error(`Error al obtener historial de transacciones: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al obtener datos del historial de transacciones.',
        technical: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // === Método existente (mantener) === //
  async getAllData(): Promise<{
    detalles: DetallePagoResponse[];
    solicitudes: SolicitudBecaLookup[];
    tiposPago: TipoPagoLookup[];
    estados: EstadoLookup[];
  }> {
    try {
      const [detalles, solicitudes, tiposPago, estados] = await Promise.all([
        this.findAll(),
        this.getAllSolicitudBecasLookup(),
        this.getAllTipoPagosLookup(),
        this.getAllEstadosLookup(),
      ]);
      return {
        detalles,
        solicitudes,
        tiposPago,
        estados,
      };
    } catch (error: any) {
      this.logger.error(`Error al obtener todos los datos: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al obtener todos los datos para gestión de Detalles de Pago.',
        technical: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}