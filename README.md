# Production Line Management App

A modern web application for managing production line participants, types, and attributes. Built with React, TypeScript, and MySQL.

## Features

- Manage participant types and their attributes
- Track participants with custom attributes
- Real-time validation of attribute values
- Responsive and modern UI
- RESTful API backend

## Tech Stack

- Frontend:
  - React
  - TypeScript
  - TailwindCSS
  - React Router
  - React Hot Toast

- Backend:
  - Node.js
  - Express
  - MySQL
  - TypeScript

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- XAMPP (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YourUsername/production-line-management
cd production-line-management
```

2. Install dependencies:
```bash
npm install
```

3. Create a MySQL database and update the connection settings in `src/server/db.ts`

4. Start the development servers:

Frontend:
```bash
npm run dev
```

Backend:
```bash
npm run server
```

## Project Structure

```
src/
├── components/        # React components
├── server/           # Backend server code
│   ├── routes/      # API routes
│   ├── utils/       # Utility functions
│   └── db.ts        # Database configuration
├── types/           # TypeScript type definitions
└── App.tsx          # Main application component
```

## API Endpoints

- `GET /api/participant-types` - Get all participant types
- `POST /api/participant-types` - Create a new participant type
- `GET /api/participant-types/:id/attributes` - Get attributes for a participant type
- `POST /api/participant-types/:id/attributes` - Add attribute to a participant type
- `GET /api/participants` - Get all participants
- `POST /api/participants` - Create a new participant
- `GET /api/participants/:id/attributes` - Get participant attributes
- `POST /api/participants/:id/attributes` - Add attribute value to participant

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 