"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const pool = promise_1.default.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'production_line_management_db',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
// Test the connection
pool.getConnection()
    .then(connection => {
    console.log('Successfully connected to the database');
    connection.release();
})
    .catch(err => {
    console.error('Error connecting to the database:', err);
});
exports.default = pool;
//# sourceMappingURL=db.js.map