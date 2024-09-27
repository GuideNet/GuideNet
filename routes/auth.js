const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const sendEmail = require("../client/src/utils/sendEmail")

// User Registration
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Check if user exists
    let user = await User.findOne({ email })
    if (user) return res.status(400).json({ msg: "User already exists" })

    // Create new user
    user = new User({ username, email, password })

    // Hash password
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)

    // Generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString()
    user.verificationCode = verificationCode
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000 // 10 minutes

    await user.save()

    // Send verification email
    const message = `Your verification code is: ${verificationCode}`
    await sendEmail(user.email, "Email Verification", message)

    res.status(201).json({
      msg: "User registered. Please check your email for the verification code.",
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

// Verify Email
router.post("/verify-email", async (req, res) => {
  try {
    const { email, verificationCode } = req.body

    const user = await User.findOne({
      email,
      verificationCode,
      verificationCodeExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res
        .status(400)
        .json({ msg: "Invalid or expired verification code" })
    }

    user.isVerified = true
    user.verificationCode = undefined
    user.verificationCodeExpires = undefined
    await user.save()

    res.json({ msg: "Email verified successfully. You can now log in." })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

// User Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user exists
    let user = await User.findOne({ email })
    if (!user) return res.status(400).json({ msg: "Invalid Credentials" })

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" })

    // Generate JWT
    const payload = { user: { id: user.id } }
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err
        res.json({ token })
      }
    )
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

module.exports = router
