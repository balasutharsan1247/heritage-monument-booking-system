# Heritage Monument E-Ticketing and Visitor Queue Management Dashboard

## Team
- Balasutharsan M
- Thejeswar V G
- Beniel Raja V

## Project goal
Build a beginner-friendly web prototype for heritage monuments that supports:
1. Monument browsing
2. Time-slot ticket booking
3. QR-code ticket generation
4. Virtual queue management
5. Admin monitoring dashboard
6. Public live queue display
7. ML-based visitor footfall prediction
8. Optional demand-based price recommendation
9. Comparative evaluation against a manual/static baseline

## Confirmed architecture
Frontend:
- React
- Vite
- Tailwind CSS
- React Router
- Recharts or Chart.js
- Socket.io client

Backend:
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.io
- JWT and bcrypt
- QR-code library

ML:
- Python
- pandas
- scikit-learn
- joblib
- FastAPI or a small Python prediction service

## Roles
Visitor:
- Browse monuments
- Select slot
- Book ticket
- View QR ticket
- View queue status

Staff:
- View current queue
- Call next visitor
- Skip or mark visitor served
- Validate QR ticket

Admin:
- Manage monuments
- View bookings and statistics
- View queue analytics
- View ML predictions
- View comparison results

## Core entities
User:
- name
- email
- passwordHash
- role

Monument:
- name
- description
- location
- latitude
- longitude
- capacity
- baseTicketPrice
- openingTime
- closingTime
- isActive

Ticket:
- visitorId
- monumentId
- visitDate
- slotStart
- slotEnd
- tokenNumber
- price
- qrCodeData
- status
- createdAt

QueueEntry:
- ticketId
- monumentId
- tokenNumber
- status
- joinedAt
- calledAt
- completedAt

VisitorLog:
- monumentId
- date
- hour
- visitorCount
- actualVisitDuration
- dayType

Prediction:
- monumentId
- targetDate
- predictedVisitorCount
- modelName
- mae
- rmse
- createdAt

## Non-negotiable rules
- Do not add blockchain, cryptocurrency, NFTs, chatbots, payment gateways, or microservices unless explicitly requested later.
- Do not use synthetic result values as real-world claims.
- Do not claim a feature is complete until it passes a test.
- Use environment variables for secrets.
- Validate inputs on the backend.
- Enforce role-based authorization on protected routes.
- Every feature must include loading, empty, success, and error states.
- Preserve existing working code when adding a module.
- Before changing a schema, explain the migration impact.