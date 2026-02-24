# AWT Backend

Backend API for the AWT Project built with Node.js and Express.

## Project Structure

```
backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── models/         # Data models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── config/         # Configuration files
│   ├── utils/          # Utility functions
│   ├── services/       # Business logic
│   └── server.js       # Entry point
├── tests/              # Test files
├── public/             # Static files
├── .env.example        # Environment variables template
├── .gitignore
└── package.json
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Configure environment variables in `.env`

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Testing
```bash
npm test
```
