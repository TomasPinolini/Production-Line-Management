"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const react_hot_toast_1 = require("react-hot-toast");
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
const pool = promise_1.default.createPool(dbConfig);
// Database utility class
class Database {
    constructor() {
        this.pool = pool;
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    // Generic query method
    async query(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        }
        catch (error) {
            console.error('Database query error:', error);
            react_hot_toast_1.toast.error('Database error occurred');
            throw error;
        }
    }
    // Generic insert method
    async insert(table, data) {
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
        try {
            const [result] = await this.pool.execute(sql, values);
            return result.insertId;
        }
        catch (error) {
            console.error('Database insert error:', error);
            react_hot_toast_1.toast.error('Failed to insert data');
            throw error;
        }
    }
    // Generic update method
    async update(table, id, data) {
        const setClause = Object.keys(data)
            .map(key => `${key} = ?`)
            .join(', ');
        const values = [...Object.values(data), id];
        const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
        try {
            const [result] = await this.pool.execute(sql, values);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Database update error:', error);
            react_hot_toast_1.toast.error('Failed to update data');
            throw error;
        }
    }
    // Generic delete method
    async delete(table, id) {
        const sql = `DELETE FROM ${table} WHERE id = ?`;
        try {
            const [result] = await this.pool.execute(sql, [id]);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Database delete error:', error);
            react_hot_toast_1.toast.error('Failed to delete data');
            throw error;
        }
    }
    // Get connection from pool
    async getConnection() {
        return await this.pool.getConnection();
    }
}
exports.db = Database.getInstance();
//# sourceMappingURL=db.js.map