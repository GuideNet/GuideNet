const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { check, validationResult } = require("express-validator")
const User = require("../models/User")
const auth = require("../middleware/authMiddleware")
const multer = require("multer")

// Set up Multer with memory storage
const upload = multer({ storage: multer.memoryStorage() })

// @route   GET api/users/:id
// @desc    Get user data by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password")
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    res.json(user)
  } catch (err) {
    console.error("Error fetching user:", err.message)
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "User not found" })
    }
    res.status(500).send("Server Error")
  }
})

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, upload.single("avatar"), async (req, res) => {
  try {
    const { role } = req.body

    // Find user by id
    let user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    // Update fields
    if (role) user.role = role
    if (req.file) {
      user.avatar.data = req.file.buffer
      user.avatar.contentType = req.file.mimetype
    }

    await user.save()

    // Don't send the avatar data back in the response
    const userResponse = user.toObject()
    delete userResponse.avatar

    res.json(userResponse)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

router.get("/avatar/:id", async (req, res) => {
  try {
    console.log("Fetching avatar for user ID:", req.params.id)
    const user = await User.findById(req.params.id)
    if (!user) {
      console.log("User not found")
      return res.status(404).send("User not found")
    }
    if (user.avatar && user.avatar.data) {
      console.log("Avatar found, sending response")
      res.set("Content-Type", user.avatar.contentType)
      return res.send(user.avatar.data)
    }
    console.log("No avatar found for user")
    res.status(404).send("No avatar found")
  } catch (err) {
    console.error("Error fetching avatar:", err)
    res.status(500).send("Server Error")
  }
})

router.get("/:id/username", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }
    res.json({ username: user.username })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

// If you have a file upload route, modify it like this:
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.")
  }

  // Here, instead of saving to disk, you can process the file in memory
  // or send it to a cloud storage service

  // Example: just sending back the file details
  res.json({
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  })
})

module.exports = router
