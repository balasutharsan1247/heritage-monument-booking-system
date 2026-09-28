# Heritage Monument Booking System - Backend

## Setup Instructions

1. **Install dependencies:**
   Ensure you are in the `backend` directory.
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root of the `backend` directory with the following variables:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/heritage_monument_booking
   ```

3. **Start the server:**
   - **Development Mode** (uses nodemon for auto-restart):
     ```bash
     npm run dev
     ```
   - **Production Mode**:
     ```bash
     npm start
     ```

## Folder Structure

- `src/config/`: Configuration files (e.g., database connection)
- `src/controllers/`: Route handlers
- `src/middleware/`: Express middleware functions
- `src/models/`: Mongoose schemas and models
- `src/routes/`: API route definitions
- `src/services/`: Business logic
- `src/utils/`: Utility functions and helpers
