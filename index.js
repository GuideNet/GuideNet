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

app.get("/", (req, res) => {
  res.send("Welcome to GuideNet API")
})

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

  // **Event for initiating a call**
  socket.on("callUser", ({ userToCall, signal, from }) => {
    const socketIdToCall = users[userToCall]
    if (socketIdToCall) {
      io.to(socketIdToCall).emit("callUser", { signal, from })
      console.log(`Calling user ${userToCall} from ${from}`)
    } else {
      console.log(`User ${userToCall} is not connected`)
    }
  })

  // **Event for accepting a call**
  socket.on("acceptCall", ({ signal, to }) => {
    const socketIdToCall = users[to]
    if (socketIdToCall) {
      io.to(socketIdToCall).emit("callAccepted", signal)
      console.log(`Call accepted by ${socket.userId} to ${to}`)
    } else {
      console.log(`User ${to} is not connected`)
    }
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
  console.log(`Server running on port ${PORT}`)
})
