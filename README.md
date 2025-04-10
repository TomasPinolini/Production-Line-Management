# Schrauber Verwaltung

A React application for managing participant types and participants in a workshop/event system.

## Features

- Participant Type Management
  - Create, read, update, and delete participant types
  - Each type can have a name and description

## Tech Stack

- Frontend:
  - React
  - TypeScript
  - Tailwind CSS
  - React Router
  - React Hot Toast

- Backend:
  - Node.js
  - Express
  - MySQL
  - TypeScript

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL Server
- XAMPP (for local development)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a MySQL database named `schrauber_verwaltung`
4. Import the database schema from `src/server/sql/create_tables.sql`

### Running the Application

1. Start the frontend development server:
   ```bash
   npm run dev
   ```

2. Start the backend server:
   ```bash
   npm run server
   ```

The application will be available at:
- Frontend: http://localhost:5174
- Backend API: http://localhost:3000

## Project Structure

```
src/
├── components/         # React components
├── server/            # Backend server code
│   ├── routes/        # API routes
│   ├── sql/          # SQL scripts
│   └── db.ts         # Database connection
├── types.ts          # TypeScript interfaces
└── App.tsx           # Main application component
``` 