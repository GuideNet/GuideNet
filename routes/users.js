const express = require("express")
const router = express.Router()
const User = require("../models/User")
const auth = require("../middleware/authMiddleware") // Import the auth middleware
const multer = require("multer")
const fs = require("fs")
const path = require("path")

const upload = multer({ dest: "uploads/" })

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
      user.avatar.data = fs.readFileSync(
        path.join(__dirname, "..", req.file.path)
      )
      user.avatar.contentType = req.file.mimetype
      // Remove the file from the uploads folder
      fs.unlinkSync(path.join(__dirname, "..", req.file.path))
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

module.exports = router
