const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const multer = require("multer")
const path = require("path")
require("dotenv").config()

const app = express()
const http = require("http")
const server = http.createServer(app)
const socketIo = require("socket.io")
const io = socketIo(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? "https://guidenet.co/"
        : "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Middleware
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? "https://guidenet.co/"
      : "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}
app.use(cors(corsOptions))
app.use(express.json({ limit: "10mb" })) // Adjust the limit as needed
app.use(express.urlencoded({ limit: "10mb", extended: true })) // Adjust the limit as needed

// Set up Multer with memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
})

// Routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const postRoutes = require("./routes/posts")
const chatRoutes = require("./routes/chats")
const mentorRoutes = require("./routes/mentors")

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/posts", postRoutes)
app.use("/api/mentors", mentorRoutes)
app.use("/api/chats", chatRoutes)

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err))

// **User Mapping for Socket.io**
const users = {} // Object to store userId: socketId mappings

// Socket.io Events
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id)

  // **Event to register a user with their userId**
  socket.on("registerUser", (userId) => {
    users[userId] = socket.id
    socket.userId = userId
    console.log(`User ${userId} registered with socket ID ${socket.id}`)
  })

  // Event for joining a chat room
  socket.on("joinChat", (chatId) => {
    socket.join(chatId)
    socket.chatId = chatId
    console.log(`Socket ${socket.id} joined chat ${chatId}`)
  })

  // Event for sending messages
  socket.on("sendMessage", ({ chatId, message }) => {
    // Broadcast the message to others in the chat room
    socket.to(chatId).emit("message", message)
    console.log(`Message sent to chat ${chatId}:`, message)
  })

  // **Event for initiating a video call signal**
  socket.on("videoCallSignal", ({ chatId, signal, isInitiator }) => {
    // Broadcast the signal to the other user in the chat room
    socket.to(chatId).emit("videoCallSignal", { signal, isInitiator })
    console.log(
      `Video call signal from ${socket.id} to chat ${chatId} | Initiator: ${isInitiator}`
    )
  })

  // **Event for joining a video call**
  socket.on("joinVideoCall", (chatId) => {
    socket.join(chatId)
    const clients = io.sockets.adapter.rooms.get(chatId)
    const numClients = clients ? clients.size : 0
    console.log(
      `Socket ${socket.id} joined video call room ${chatId}. Total clients: ${numClients}`
    )
    if (numClients === 1) {
      socket.emit("waitForCall")
      console.log("Waiting for another participant to join the call.")
    } else if (numClients === 2) {
      // Emit 'initiateCall' only to the second user who joined
      socket.emit("initiateCall")
      console.log("Initiating call for the new participant.")
    }
  })

  // **Event for ending a video call**
  socket.on("endCall", (chatId) => {
    socket.to(chatId).emit("callEnded")
    console.log(`Call ended in chat ${chatId} by socket ${socket.id}`)
  })

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id)
    if (socket.userId) {
      delete users[socket.userId]
      console.log(`User ${socket.userId} removed from users list`)
    }
  })
})

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")))

  // Handle API routes
  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next()
    }
  })

  // For any other routes, serve the React app
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
  })
}

// Start the server
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
