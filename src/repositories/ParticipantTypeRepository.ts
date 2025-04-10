import { db } from '../lib/db';
import { ParticipantType, VariableAttribute } from '../types/database';
import { RowDataPacket } from 'mysql2';

export class ParticipantTypeRepository {
  private static table = 'participant_type';

  // Create a new participant type
  static async create(data: Omit<ParticipantType, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const now = new Date();
    const participantType = {
      ...data,
      created_at: now,
      updated_at: now
    };
    return await db.insert<ParticipantType>(this.table, participantType);
  }

  // Get all participant types
  static async findAll(): Promise<ParticipantType[]> {
    const sql = `SELECT * FROM ${this.table} ORDER BY name ASC`;
    return await db.query<ParticipantType>(sql);
  }

  // Get a participant type by ID
  static async findById(id: number): Promise<ParticipantType | null> {
    const sql = `SELECT * FROM ${this.table} WHERE id = ?`;
    const result = await db.query<ParticipantType>(sql, [id]);
    return result[0] || null;
  }

  // Update a participant type
  static async update(id: number, data: Partial<Omit<ParticipantType, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const now = new Date();
    const updateData = {
      ...data,
      updated_at: now
    };
    return await db.update<ParticipantType>(this.table, id, updateData);
  }

  // Delete a participant type
  static async delete(id: number): Promise<boolean> {
    return await db.delete(this.table, id);
  }

  // Get participant type with its attributes
  static async findWithAttributes(id: number): Promise<(ParticipantType & { attributes: VariableAttribute[] }) | null> {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get participant type
      const [participantTypes] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM ${this.table} WHERE id = ?`,
        [id]
      );

      if (!participantTypes[0]) {
        return null;
      }

      // Get attributes
      const [attributes] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM variable_attribute WHERE participant_type_id = ?`,
        [id]
      );

      await connection.commit();

      return {
        ...participantTypes[0] as ParticipantType,
        attributes: attributes as VariableAttribute[]
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
} 