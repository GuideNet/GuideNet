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
    origin: "*", // Adjust this to your client's origin in production
  },
})

// Middleware
app.use(cors())
app.use(express.json())

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

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err))

// Set up Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/")
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    )
  },
})

const upload = multer({ storage: storage })

// Start the server
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
