#  Production Line Management

A React application for managing participant types and participants in a workshop/event system.

## Features

- Participant Type Management
  - Create, read, update, and delete participant types
  - Manage variable attributes for each participant type
  - Support for formatted data validation (MAC addresses, IP addresses, etc.)
- Participant Management
  - Create and manage participants for each type
  - Track participant attributes with format validation
  - Real-time validation of attribute values

## Tech Stack

- Frontend:
  - React 18
  - TypeScript
  - Tailwind CSS
  - React Router
  - React Hot Toast
  - Lucide React (icons)
  - Vite (build tool)

- Backend:
  - Node.js
  - Express
  - MySQL
  - TypeScript
  - CORS

## Prerequisites

1. Node.js (v16 or higher)
2. XAMPP (for MySQL and Apache)
3. Git
4. A code editor (VS Code recommended)

## Step-by-Step Installation

### 1. Install XAMPP
1. Download XAMPP from [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. Install XAMPP with at least MySQL and Apache modules
3. Start XAMPP Control Panel
4. Start MySQL and Apache services

### 2. Set Up Database
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Go to the Import tab
3. Select the file `src/server/sql/setup_database.sql`
4. Click "Go" to import
   - This will create the database and all required tables
   - If you see any errors about the database already existing, you can ignore them

Note: If you prefer using the MySQL command line:
```bash
mysql -u root < src/server/sql/setup_database.sql
```

### 3. Clone and Set Up the Project
1. Open terminal/command prompt
2. Navigate to XAMPP's htdocs directory:
   ```bash
   cd C:\xampp\htdocs  # Windows
   # or
   cd /Applications/XAMPP/htdocs  # macOS
   ```
3. Clone the repository:
   ```bash
   git clone https://github.com/TomasPinolini/Production-Line-Management.git SchrauberVerwaltung
   cd SchrauberVerwaltung
   ```
4. Install dependencies:
   ```bash
   npm install
   ```

### 4. Configure the Application
1. Update database configuration in `src/server/db.ts`:
   ```typescript
   const pool = mysql.createPool({
     host: 'localhost',
     user: 'root',  // default XAMPP MySQL user
     password: '',  // default XAMPP MySQL password
     database: 'production_line_management_db',
     waitForConnections: true,
     connectionLimit: 10,
     queueLimit: 0
   });
   ```

## Running the Application

### 1. Start the Backend Server
1. Open a terminal in the project directory
2. Build and start the server:
   ```bash
   npm run server
   ```
   The backend will run on http://localhost:3000

### 2. Start the Frontend Development Server
1. Open another terminal in the project directory
2. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will run on http://localhost:5174

### 3. Verify Installation
1. Open your browser and navigate to http://localhost:5174
2. You should see the application interface
3. Test the API at http://localhost:3000/api/participant-types

## Project Structure

```
src/
├── components/           # React components
│   ├── participants/    # Participant-related components
│   └── ...
├── server/              # Backend server code
│   ├── routes/         # API routes
│   ├── sql/           # SQL scripts
│   ├── utils/         # Utility functions
│   └── db.ts         # Database connection
├── types.ts            # TypeScript interfaces
└── App.tsx             # Main application component
```

## Common Issues and Solutions

### Backend Won't Start
- Check if MySQL is running in XAMPP
- Verify database credentials in `src/server/db.ts`
- Ensure ports 3000 and 5174 are available

### Database Connection Issues
- Check if MySQL service is running
- Verify database name is correct
- Ensure database user has proper permissions

### Frontend Build Issues
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: 
  ```bash
  rm -rf node_modules
  npm install
  ```

## Development Commands

```bash
# Start frontend development server
npm run dev

# Build frontend
npm run build

# Build backend
npm run build:server

# Start backend server
npm run start:server

# Run both backend build and start
npm run server

# Run linter
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request 