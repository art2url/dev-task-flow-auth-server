# DevTaskFlow Auth Server

DevTaskFlow Auth Server is a backend authentication service built with **Node.js**, **Express**, and **MongoDB**. It handles user authentication, authorization, and security using **JWT** tokens for auth. The server provides RESTful API endpoints for user management, login, registration, password recovery, and secure task data access. Integrated with Nodemailer for email-based password resets, it ensures a seamless authentication flow for the DevTaskFlow task management application.

---
## Features
- **User Registration and Login** \- Uses bcrypt to securely store passwords.
- **Authentication via JWT** \- Protect routes with `authenticate` middleware.
- **Password Recovery** \- Generates a new password and emails it.
- **Task Management** \- Create, read, update, and delete tasks linked to a user.

---
## Setup & Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/art2url/dev-task-flow-auth-server.git
   cd dev-task-flow-auth-server
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Create a `.env` file** with your credentials:
   ```bash
   MONGO_URI="<your-mongodb-connection-string>"
   JWT_SECRET="<your-jwt-secret>"
   EMAIL_USER="<your-email-username>"
   EMAIL_PASS="<your-email-password>"
   PORT=3000 # or your preferred port
   ```
4. **Run the server**:
   ```bash
   npm start
   ```
   The server starts on `http://localhost:3000` by default.

---
## Project Structure
```
├── server.js             # Main server file with routes
├── package.json          # Node dependencies and scripts
├── .env                  # Environment variables
└── ...other configs
```
---
## Routes

### **Auth Routes**
- **POST** `/register`
  - Registers a user by hashing the provided password and storing user info.
  - Request Body:
    ```json
    {
      "username": "string",
      "email": "string",
      "password": "string"
    }
    ```
- **POST** `/login`
  - Authenticates a user using bcrypt, generates a JWT.
  - Request Body:
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```

### **Forgot Password**
- **POST** `/forgot-password`
  - Generates a random password, hashes it, and emails it to the user.
  - Request Body:
    ```json
    {
      "email": "string"
    }
    ```

### **Task Routes** (Protected)
> These routes require an `Authorization` header with a valid JWT token:  
> `Authorization: Bearer <token>`

- **GET** `/tasks`
  - Fetches all tasks for the authenticated user.

- **POST** `/tasks`
  - Creates a new task for the authenticated user.
  - Request Body (example):
    ```json
    {
      "title": "string",
      "description": "string",
      "priority": "Low | Medium | High",
      "deadline": "Date",
      "pinned": "boolean",
      "completed": "boolean"
    }
    ```

- **PUT** `/tasks/:taskId`
  - Updates an existing task by its `taskId`.
  - Request Body (fields to update):
    ```json
    {
      "title": "string",
      "description": "string",
      "priority": "string",
      "deadline": "Date",
      "pinned": "boolean",
      "completed": "boolean"
    }
    ```

- **DELETE** `/tasks/:taskId`
  - Deletes a single task by `taskId`.

- **DELETE** `/tasks`
  - Deletes **all** tasks for the authenticated user.

---
## Usage
1. **Register** a user via `POST /register`.
2. **Login** via `POST /login`. A JSON Web Token is returned.
3. **Attach JWT** in the `Authorization: Bearer <token>` header for protected routes.

---
## Environment Variables
Ensure you have the following variables in your `.env`:
```
MONGO_URI=<your mongodb uri>
JWT_SECRET=<your jwt secret>
EMAIL_USER=<your email user>
EMAIL_PASS=<your email password>
PORT=<port to run on>
```

---
## Security Considerations
- **JWT** is used for stateless authentication.
- **BCrypt** for hashing passwords.
- **CORS** is enabled with either `origin: '*'` or a specific domain.

---
## Contributing
1. Fork the repo.
2. Create a feature branch.
3. Commit changes.
4. Push and open a Pull Request.

---
## License
MIT License.

---
## Contact
For questions or issues, please open an issue or reach out to the maintainers. Thank you for using **DevTaskFlow Auth Server**!

