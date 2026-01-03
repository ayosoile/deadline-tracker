Carleton Deadlines 📅 : Check it out here -> https://deadline-tracker-frontend-qry6.onrender.com/

Carleton Deadlines is a full-stack web application that helps students track assignments, midterms, and exams in one centralized dashboard. Users can securely register, log in, and manage their own academic deadlines with automatic sorting and overdue detection.

🚀 Features

User authentication with JWT (register, login, logout)

Secure, user-specific deadlines (each user only sees their own data)

Create, edit, and delete deadlines

Automatic calculation of days remaining and overdue status

Deadlines sorted by due date

Demo mode for guests (read-only)

Responsive and clean UI

🛠 Tech Stack
Frontend

React

JavaScript (ES6+) with JSX for HTML

CSS

Fetch API

Backend

Node.js

Express.js

MongoDB & Mongoose

JSON Web Tokens (JWT)

bcrypt (password hashing)


🔐 Authentication Overview

Passwords are hashed using bcrypt before being stored in the database

JWTs are issued on login and registration

Protected routes require a valid JWT via the Authorization header

Tokens include the user ID and email and expire after 1 day

📡 API Endpoints
Auth

POST /register – Create a new user

POST /login – Authenticate user and return JWT

Deadlines (Protected)

GET / – Get all deadlines for the authenticated user

POST / – Add a new deadline

PUT /:id – Update an existing deadline

DELETE /:id – Delete a deadline

🌱 Future Improvements

Email notifications for upcoming deadlines

Calendar view integration

Password reset functionality

Deployment ✅
