import mysql from 'mysql2/promise';
declare class Database {
    private static instance;
    private pool;
    private constructor();
    static getInstance(): Database;
    query<T>(sql: string, params?: any[]): Promise<T[]>;
    insert<T>(table: string, data: Partial<T>): Promise<number>;
    update<T>(table: string, id: number, data: Partial<T>): Promise<boolean>;
    delete(table: string, id: number): Promise<boolean>;
    getConnection(): Promise<mysql.PoolConnection>;
}
export declare const db: Database;
export {};
//# sourceMappingURL=db.d.ts.map