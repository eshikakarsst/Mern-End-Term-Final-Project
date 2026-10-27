# StudySync — Study Group Collaboration Platform

StudySync is a full-stack study-group collaboration application that helps students organize subjects and topics, coordinate assignments, schedule study sessions, communicate with group members, and monitor learning progress in one place.

> **Project type:** End-Term Software Project  
> **Application:** Web application  
> **Author:** Eshika Kar  
> **Status:** Update the deployment and demo links below before submitting.

## Table of Contents

- [Problem Statement](#problem-statement)
- [Target Users](#target-users)
- [Solution](#solution)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Security Notes](#security-notes)
- [Known Limitations](#known-limitations)
- [Deployment](#deployment)
- [Demo](#demo)
- [Future Improvements](#future-improvements)
- [Author](#author)

## Problem Statement

Students working in study groups often need to coordinate learning topics, divide work, track progress, arrange study sessions, and communicate across separate tools. This can make it difficult to maintain a shared view of deadlines, responsibilities, and group progress.

StudySync brings these study-group workflows together in a single application.

## Target Users

- Students studying together for courses, exams, or projects.
- Study-group administrators coordinating members and topics.
- Learners who want to plan individual study tasks while staying aligned with a group.

## Solution

StudySync provides group workspaces with subject and topic organization, member assignments, task planning, session scheduling, real-time chat, notifications, and progress summaries. Authenticated users can manage their own study tasks and participate in groups according to their role and membership.

## Key Features

### Accounts and access
- Registration and login.
- Password hashing with `bcryptjs`.
- Short-lived JWT access tokens and refresh-token cookies using `HttpOnly` cookies.
- Authentication middleware for protected backend routes.

### Study groups
- Create study groups and join them using invite codes.
- Search, filter, and sort groups.
- Admin/member roles and group-membership checks.
- Copy invite codes from the workspace.

### Subjects, topics, and progress
- Organize group learning by subject and topic.
- Assign topics to group members and update topic progress.
- Share resource links or file URLs on topics.
- View group progress summaries, including completion rates, subject/member breakdowns, stale topics, and upcoming sessions.

### Personal planning and focus
- Create personal study tasks with due dates and optional group/topic links.
- Use a focus timer with configurable focus, short-break, and long-break durations.
- View calendar items such as group sessions and task deadlines.

### Study sessions
- Schedule group study sessions.
- Detect overlapping sessions.
- RSVP to sessions.

### Communication and notifications
- Real-time group chat using Socket.IO.
- Persisted chat message history in MongoDB.
- In-app notifications with unread counts and read actions.
- Live group events for topic assignments, status updates, and relevant alerts.
- Socket room access checks based on group membership.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, React Router, Axios, React Query, React Hook Form, Recharts |
| Styling | Tailwind CSS, PostCSS, Autoprefixer |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cookie-parser` |
| Real-time features | Socket.IO and Socket.IO Client |
| Security and middleware | Helmet, CORS, Express Rate Limit, Morgan, dotenv |
| Group invite codes | Nano ID |

## Architecture

StudySync uses a frontend/backend architecture:

```text
Browser (React + Vite)
        |
        | HTTP requests (Axios)
        v
Express REST API -------------------- MongoDB
        |                               |
        | Authentication middleware     | Mongoose models
        |
        +-------- Socket.IO ------------+
                  Real-time events
```

- **Frontend:** Renders the user interface, navigation, forms, dashboards, planner, calendar, and chat experience.
- **Backend:** Exposes API routes, validates authenticated requests, enforces access checks, and coordinates application logic.
- **Database:** MongoDB stores application records through Mongoose.
- **Real-time layer:** Socket.IO supports group events and chat. Access to group rooms is checked against membership.
- **Configuration:** Environment variables hold database connection details, token secrets, URLs, and runtime settings.

## Project Structure

```text
studysync/
├── frontend/
│   ├── src/                  # React application source
│   ├── public/               # Static assets, if present
│   ├── .env.example          # Frontend environment template
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── config/               # Backend configuration
│   ├── controllers/          # Request handlers
│   ├── middleware/           # Authentication and other middleware
│   ├── models/               # Mongoose data models
│   ├── routes/               # Express routes
│   ├── sockets/              # Socket.IO handlers
│   ├── utils/                # Shared utilities
│   ├── .env.example          # Backend environment template
│   ├── package.json
│   └── server.js
└── README.md
```

*The tree describes the main folders; individual files may vary as the project evolves.*

## Prerequisites

Install the following before running the project locally:

- Node.js 18 or newer and npm.
- A MongoDB database, either a local MongoDB instance or MongoDB Atlas.
- Git (optional, for cloning the repository).

## Getting Started

### 1. Get the source code

Clone the repository, or download and extract the project ZIP. If cloning, replace the placeholder URL with your actual GitHub repository URL:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd studysync
```

### 2. Configure the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and set a valid MongoDB connection string and unique, long random JWT secrets. Do not commit this file.

Start the backend in development mode:

```bash
npm run dev
```

The backend uses port `5000` by default. Its health endpoint is:

`http://localhost:5000/api/health`

Keep this terminal running.

### 3. Configure and start the frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the local URL printed by Vite. The default development URL is:

`http://localhost:5173`

The frontend environment template points API requests to `http://localhost:5000/api` and Socket.IO to `http://localhost:5000`.

### 4. Verify the application

- Open the frontend in your browser.
- Register an account and log in.
- Create a study group and try joining it with an invite code from another account.
- Test topic assignment, task planning, session scheduling, chat, and notifications.
- Check the browser console and backend terminal for errors if a workflow does not behave as expected.

## Environment Variables

### Backend — `backend/.env`

| Variable | Purpose | Example / default |
|---|---|---|
| `PORT` | Port for the Express server | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://<user>:<pass>@cluster.mongodb.net/studysync` |
| `JWT_SECRET` | Secret used to sign access tokens | Generate a long, random secret |
| `JWT_REFRESH_SECRET` | Secret used to sign refresh tokens | Generate a different long, random secret |
| `JWT_EXPIRES_IN` | Access-token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token lifetime | `7d` |
| `CLIENT_URL` | Frontend origin allowed by backend CORS | `http://localhost:5173` |
| `NODE_ENV` | Runtime environment | `development` |

### Frontend — `frontend/.env`

| Variable | Purpose | Local development value |
|---|---|---|
| `VITE_API_URL` | Base URL for API requests | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:5000` |

For deployment, set these values in the hosting provider's environment-variable settings and use the actual production URLs. Frontend variables prefixed with `VITE_` are included in the client bundle, so **never put secrets in them**.

## Available Scripts

### Frontend (`frontend/`)

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production frontend into `dist/` |
| `npm run preview` | Preview the production build locally |

### Backend (`backend/`)

| Command | Description |
|---|---|
| `npm run dev` | Start the backend with Nodemon |
| `npm start` | Start the backend with Node.js |

## Security Notes

- Keep `.env` files out of Git and do not include real credentials in shared ZIP files.
- Use strong, unique values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- If any real secret has already been shared or committed, rotate it; deleting the file alone does not invalidate an exposed secret.
- Use HTTPS in production and configure secure cookie settings and CORS for the deployed frontend origin.
- Validate and authorize operations on the backend; hiding a frontend control is not a substitute for server-side authorization.
- Review logs and error responses to ensure they do not expose tokens, credentials, or private user data.

## Known Limitations

- Topic resources store a URL; binary file uploads are not implemented.
- Focus timer settings, state, and history are stored in the current browser and are not synchronized across devices.
- Planner tasks belong to the signed-in user, even when linked to a group or topic.
- Real-time group events and chat require an authenticated Socket.IO connection; group room access depends on membership checks.
- Production cookie, HTTPS, and CORS settings must be configured for the deployment environment.

## Deployment

The project is intended to be deployed with a frontend host, a Node.js backend host, and a reachable MongoDB database. Configure the production environment variables on the relevant hosting platforms, including the deployed frontend origin in `CLIENT_URL` and the deployed backend URLs in `VITE_API_URL` and `VITE_SOCKET_URL`.

Add your real links before submission:

- **Live application:** `<YOUR_DEPLOYED_APPLICATION_URL>`
- **GitHub repository:** `<YOUR_GITHUB_REPOSITORY_URL>`
- **Backend health check:** `<YOUR_DEPLOYED_BACKEND_URL>/api/health`

Do not leave placeholder links in the final submission. Open each link in a private/incognito window to verify that evaluators can access it.

## Demo

- **Demo video (3–5 minutes):** `<YOUR_DEMO_VIDEO_URL>`

Suggested demo flow:
1. Introduce the problem and intended users.
2. Register or log in.
3. Create a group and demonstrate joining with an invite code.
4. Add a subject/topic and assign work.
5. Show task planning, study sessions, and progress summaries.
6. Demonstrate real-time chat and notifications.
7. Briefly explain the architecture and technology stack.

Replace the placeholder with an accessible video link before submission.

## Future Improvements

Potential future improvements include binary file uploads, cross-device synchronization for focus history, automated tests for critical workflows, and additional production monitoring. These are future possibilities, not claims that they are currently implemented.

## Author

**Eshika Kar**  
Mern End-Term Project — StudySync
