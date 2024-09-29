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
app.use(express.json())

// Set up Multer with memory storage
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

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
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err))

// Socket.IO Event Handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id)

  socket.on("registerUser", (userId) => {
    socket.join(userId)
    console.log(`User registered and joined room: ${userId}`)
  })

  socket.on("sendMessage", ({ chatId, message }) => {
    io.to(chatId).emit("message", message)
  })

  socket.on("callUser", ({ userToCall, signal, from }) => {
    io.to(userToCall).emit("callUser", { signal, from })
  })

  socket.on("acceptCall", ({ signal, to }) => {
    io.to(to).emit("callAccepted", signal)
  })

  socket.on("joinChat", (chatId) => {
    socket.join(chatId)
    console.log(`Socket ${socket.id} joined chat room: ${chatId}`)
  })

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id)
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
} else {
  // In development, keep the API route
  app.get("/", (req, res) => {
    res.send("Welcome to GuideNet API")
  })
}

// Start the server
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
