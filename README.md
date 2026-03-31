# 💬 NexChat — Real-Time Chat Application

NexChat is a full-stack real-time chat application built using **Node.js, React, WebSockets, and MongoDB Atlas**.
It enables users to communicate instantly with features like live messaging, typing indicators, and room-based chats.

---

## 🚀 Features

* 🔐 JWT-based Authentication
* 💬 Real-time messaging using WebSockets
* 🟢 Online / Offline user status
* ✍️ Typing indicators
* 🏠 Room-based chat system
* ☁️ MongoDB Atlas (Cloud Database)
* ⚡ Multiple connections (multi-tab support)

---

## 🛠️ Tech Stack

### Frontend

* React.js
* WebSocket (ws)
* Axios

### Backend

* Node.js
* Express.js
* WebSocket (ws)
* MongoDB + Mongoose
* JWT Authentication

---

## 📂 Project Structure

```
chat-app/
├── client/        # React frontend
├── server/        # Node.js backend
│   ├── models/
│   ├── routes/
│   ├── config/
│   └── websocket.js
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone repository

```bash
git clone https://github.com/your-username/nexchat.git
cd nexchat/chat-app
```

---

### 2️⃣ Setup Backend

```bash
cd server
npm install
```

Create `.env` file:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

---

### 3️⃣ Setup Frontend

```bash
cd ../client
npm install
```

---

### 4️⃣ Run Application

```bash
cd ..
npm run dev
```

---

## 🌐 Application URLs

* Frontend: http://localhost:3000
* Backend: http://localhost:5000
* WebSocket: ws://localhost:5000/ws

---

## 🔒 Environment Variables

Create `.env` in `/server`:

```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

---

## 📌 Future Improvements

* 📎 File sharing support
* 🔔 Push notifications
* 🌍 Deployment (Render / Vercel)
* 📱 Mobile responsive UI

---

## 👨‍💻 Author

**Nagesh Kumar**

---

## ⭐ If you like this project

Give it a star ⭐ on GitHub!
