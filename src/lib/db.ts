import mysql from 'mysql2/promise';
import { toast } from 'react-hot-toast';

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'schrauber_verwaltung',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database utility class
class Database {
  private static instance: Database;
  private pool: mysql.Pool;

  private constructor() {
    this.pool = pool;
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Generic query method
  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows as T[];
    } catch (error) {
      console.error('Database query error:', error);
      toast.error('Database error occurred');
      throw error;
    }
  }

  // Generic insert method
  async insert<T>(table: string, data: Partial<T>): Promise<number> {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    
    try {
      const [result] = await this.pool.execute(sql, values);
      return (result as mysql.ResultSetHeader).insertId;
    } catch (error) {
      console.error('Database insert error:', error);
      toast.error('Failed to insert data');
      throw error;
    }
  }

  // Generic update method
  async update<T>(table: string, id: number, data: Partial<T>): Promise<boolean> {
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(data), id];
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    
    try {
      const [result] = await this.pool.execute(sql, values);
      return (result as mysql.ResultSetHeader).affectedRows > 0;
    } catch (error) {
      console.error('Database update error:', error);
      toast.error('Failed to update data');
      throw error;
    }
  }

  // Generic delete method
  async delete(table: string, id: number): Promise<boolean> {
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    
    try {
      const [result] = await this.pool.execute(sql, [id]);
      return (result as mysql.ResultSetHeader).affectedRows > 0;
    } catch (error) {
      console.error('Database delete error:', error);
      toast.error('Failed to delete data');
      throw error;
    }
  }

  // Get connection from pool
  async getConnection(): Promise<mysql.PoolConnection> {
    return await this.pool.getConnection();
  }
}

export const db = Database.getInstance(); 