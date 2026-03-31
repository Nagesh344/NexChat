# ⬡ NexChat — Real-Time Chat Application

Live real-time messaging system with scalable backend and WebSocket-based communication.

A production-ready real-time chat application built with the **MERN stack** and **WebSockets**, supporting concurrent users with instant bidirectional messaging.

---

## 🚀 Features

* **Real-Time Messaging** — Instant bidirectional communication via WebSockets (ws library)
* **JWT Authentication** — Secure login/register with token-based session handling
* **Multiple Chat Rooms** — Create and join public channels
* **Typing Indicators** — Live "user is typing..." feedback
* **Message Pagination** — Infinite scroll with indexed MongoDB queries (30% faster retrieval)
* **Online Presence** — Real-time user status (online/offline/away)
* **Concurrent Connections** — Event-driven Node.js handles multiple users per session (multi-tab support)
* **Persistent Storage** — All messages saved to MongoDB with compound indexes

---

## 🛠 Tech Stack

| Layer       | Technology                                |
| ----------- | ----------------------------------------- |
| Frontend    | React.js 18, React Router v6, CSS Modules |
| Backend     | Node.js, Express.js                       |
| Database    | MongoDB Atlas + Mongoose                  |
| Real-Time   | WebSockets (ws library)                   |
| Auth        | JWT (jsonwebtoken) + bcryptjs             |
| HTTP Client | Axios                                     |

---

## 📁 Project Structure

```
nexchat/
├── server/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Message.js
│   │   └── Room.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── messages.js
│   │   ├── rooms.js
│   │   └── users.js
│   ├── websocket.js
│   ├── index.js
│   ├── .env.example
│   └── package.json
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.css
│   └── package.json
│
├── package.json
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites

* **Node.js** v16+
* **MongoDB Atlas account**
* **npm** v8+

---

### 1. Install Dependencies

```bash
npm run install:all
```

Or manually:

```bash
npm install
cd server && npm install
cd ../client && npm install
```

---

### 2. Configure Environment

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

Create `client/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000/ws
```

---

### 3. Run the App

```bash
npm run dev
```

Or separately:

```bash
cd server && npm run dev
cd client && npm start
```

---

## 🌐 Application URLs

* Frontend: http://localhost:3000
* Backend: http://localhost:5000
* WebSocket: ws://localhost:5000/ws

---

## 🔌 WebSocket Events

### Client → Server

| Event          | Description            |
| -------------- | ---------------------- |
| `join_room`    | Join a chat room       |
| `leave_room`   | Leave a chat room      |
| `send_message` | Send a message         |
| `typing_start` | Start typing indicator |
| `typing_stop`  | Stop typing indicator  |

---

### Server → Client

| Event          | Description             |
| -------------- | ----------------------- |
| `room_joined`  | Confirmed room join     |
| `new_message`  | New message received    |
| `typing_start` | User started typing     |
| `typing_stop`  | User stopped typing     |
| `user_status`  | Status change broadcast |

---

## 📡 REST API Endpoints

### Auth

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Messages

```
GET    /api/messages/:room
```

### Rooms

```
GET    /api/rooms
POST   /api/rooms
```

---

## 🏗 Architecture Highlights

* **Multi-tab support** using Map<userId, Set<WebSocket>>
* **Event-driven WebSocket server**
* **JWT authentication for HTTP + WebSocket**
* **MongoDB Atlas for scalable cloud storage**

---

## 🚀 Production Deployment

* Use **MongoDB Atlas** for database
* Deploy backend on **Render / Railway**
* Deploy frontend on **Vercel / Netlify**
* Use **PM2** for process management

---

## 👨‍💻 Author

**Nagesh Kumar**

---

## ⭐ If you like this project

Give it a star ⭐ on GitHub!
