import { Injectable } from '@nestjs/common';
import * as sql from 'mssql';

@Injectable()
export class SqlService {
  private pool: sql.ConnectionPool;

  private readonly config: sql.config = {
    user: 'sa',
    password: 'TuContrasena123!', // Cambia esta contraseña por la que usaste
    server: 'localhost', // Cambiado de 'JEANFRANCO\\JEANFRANCO' a 'localhost'
    database: 'DbBecas',
    options: {
      encrypt: false, // Cambiado a false para Docker
      trustServerCertificate: true,
      port: 1433 // Puerto explícito
    },
  };

  async getConnection(): Promise<sql.ConnectionPool> {
    if (!this.pool || !this.pool.connected) {
      try {
        this.pool = await sql.connect(this.config);
        console.log('Conectado a la base de datos SQL Server.');
      } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        throw error;
      }
    }
    return this.pool;
  }

  // Método nuevo para ejecutar SP o consultas
  async query(queryString: string, params?: { [key: string]: any }) {
    const pool = await this.getConnection();
    const request = pool.request();

    // Agregar parámetros si los hay
    if (params) {
      for (const key in params) {
        request.input(key, params[key]);
      }
    }

    const result = await request.query(queryString);
    return result.recordset; // Devuelve solo los registros
  }

  async closeConnection() {
    if (this.pool && this.pool.connected) {
      try {
        await this.pool.close();
        console.log('Conexión a la base de datos SQL Server cerrada.');
      } catch (error) {
        console.error('Error al cerrar la conexión de la base de datos:', error);
      }
    }
  }
}