import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',  // XAMPP default has no password
  database: 'production_line_management_db',
  port: 3306,    // XAMPP default MySQL port
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

export default pool; 