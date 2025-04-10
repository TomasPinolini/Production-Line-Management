# Production Line Management System

A web-based system for managing production lines, participants, and their attributes.

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

- Node.js (v18 or higher)
- XAMPP (for MySQL and Apache)
- Git
- A code editor (e.g., VS Code)

## Installation

### 1. Install XAMPP
1. Download and install XAMPP from https://www.apachefriends.org/
2. Start Apache and MySQL services from XAMPP Control Panel

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
1. Open a terminal and navigate to XAMPP's htdocs folder:
   ```bash
   cd C:\xampp\htdocs
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/TomasPinolini/Production-Line-Management
   cd Production-Line-Management
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### 4. Start the Application

1. Start the backend server:
   ```bash
   npm run server
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## Project Structure

```
Production-Line-Management/
├── src/
│   ├── components/     # React components
│   ├── server/        # Backend server code
│   │   ├── routes/    # API routes
│   │   ├── sql/       # Database scripts
│   │   └── utils/     # Utility functions
│   └── types/         # TypeScript type definitions
├── public/            # Static files
└── package.json       # Project dependencies
```

## Development

- Backend code is in TypeScript under `src/server/`
- Frontend React components are in `src/components/`
- Database schema is in `src/server/sql/setup_database.sql`
- API routes are defined in `src/server/routes/`

## Common Issues

1. If you see "no database selected":
   - Make sure you've imported the SQL file in phpMyAdmin
   - Check that the database name in `src/server/db.ts` matches your setup

2. If the server won't start:
   - Ensure XAMPP's MySQL service is running
   - Check if another process is using port 3000
   - Make sure all dependencies are installed (`npm install`)

3. If changes aren't showing:
   - For backend changes: restart the server (`npm run server`)
   - For frontend changes: refresh the browser

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request 