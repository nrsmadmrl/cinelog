# 🎬 Cinelog

A social platform for sharing and discovering films, series, and music. Users can post reviews, rate content, like and comment on posts, and organize their favorites into lists.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [API Documentation](#api-documentation)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)

---

## ✨ Features

- 🔐 User registration and login with JWT authentication
- 🎬 Browse films, series and music with real posters (TMDB API)
- ⭐ Rate and review content (1-10 scale)
- 📝 Create Instagram-like posts linked to content
- ❤️ Like and comment on posts
- 📋 Organize content into lists (Watch Later, Playlists, Custom)
- 👤 User profiles with post and review history
- 🛡️ Admin system — only admins can import/delete content
- 📄 Interactive API docs with Swagger UI

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JavaScript (SPA), HTML5, CSS3 |
| Backend | Node.js, Express.js |
| Database | SQLite (better-sqlite3) |
| Authentication | JWT (jsonwebtoken), bcryptjs |
| API Docs | Swagger UI (swagger-jsdoc, swagger-ui-express) |
| External API | TMDB (The Movie Database) |
| Testing | Jest |
| Version Control | Git & GitHub |

---

## 📁 Project Structure

```
cinelog/
├── backend/
│   ├── db/
│   │   └── database.js        # SQLite setup and schema
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── routes/                # Express route handlers (HTTP layer only)
│   │   ├── userRoutes.js
│   │   ├── contentRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── postRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── likeRoutes.js
│   │   ├── listRoutes.js
│   │   └── tmdbRoutes.js
│   ├── services/              # Business logic (unit tested)
│   │   ├── userService.js
│   │   ├── contentService.js
│   │   ├── reviewService.js
│   │   ├── postService.js
│   │   ├── commentService.js
│   │   ├── likeService.js
│   │   ├── listService.js
│   │   └── tmdbService.js
│   └── app.js                 # Express app entry point
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── api.js             # API helper functions
│   │   ├── auth.js            # Auth state management
│   │   ├── app.js             # SPA router
│   │   └── pages/
│   │       ├── home.js
│   │       ├── explore.js
│   │       ├── profile.js
│   │       ├── login.js
│   │       └── register.js
│   └── index.html
├── tests/                     # Jest unit tests
├── swagger.js                 # Swagger configuration
├── package.json
├── .env                       # Environment variables (not in repo)
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js v18 or higher
- npm
- A TMDB API key (free at [themoviedb.org](https://www.themoviedb.org))

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/cinelog.git
cd cinelog
```

**2. Install dependencies**
```bash
npm install
```

**3. Create environment file**

Create a `.env` file in the root directory:
```
TMDB_API_KEY=your_tmdb_api_key_here
JWT_SECRET=your_secret_key_here
PORT=3000
```

**4. Start the development server**
```bash
npm run dev
```

**5. Open in browser**
```
http://localhost:3000
```

### Setting up an Admin User

After registering your account, run this command to grant admin privileges:
```bash
node -e "const db = require('./backend/db/database'); db.prepare('UPDATE users SET is_admin = 1 WHERE username = ?').run('YOUR_USERNAME'); console.log('Admin set!');"
```

---

## 📄 API Documentation

Interactive API documentation is available at:
```
http://localhost:3000/api-docs
```

### Main Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/users/register` | Register a new user | No |
| POST | `/api/users/login` | Login | No |
| GET | `/api/content` | Get all content | No |
| POST | `/api/content` | Create content | Admin |
| GET | `/api/reviews/content/:id` | Get reviews for content | No |
| POST | `/api/reviews` | Create a review | Yes |
| GET | `/api/posts` | Get all posts | No |
| POST | `/api/posts` | Create a post | Yes |
| POST | `/api/likes/post/:id/toggle` | Toggle like | Yes |
| POST | `/api/comments` | Add a comment | Yes |
| GET | `/api/tmdb/search` | Search TMDB | No |
| POST | `/api/tmdb/import` | Import from TMDB | Admin |

---

## 🧪 Running Tests

```bash
npm test
```

Unit tests cover the business logic in the `services/` layer.

---

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `TMDB_API_KEY` | Your TMDB API key from themoviedb.org |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `PORT` | Server port (default: 3000) |

---

## 👤 Author

Developed as part of the System Analysis and Design course — Spring 2026.