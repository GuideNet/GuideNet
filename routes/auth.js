const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const sendEmail = require("../client/src/utils/sendEmail")
const crypto = require("crypto")
const nodemailer = require("nodemailer")
const { Client, Account } = require("appwrite")

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)

const account = new Account(client)

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

// Route to request a password reset
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    const token = crypto.randomBytes(20).toString("hex")
    user.resetPasswordToken = token
    user.resetPasswordExpires = Date.now() + 3600000 // 1 hour

    try {
      await user.save()
      console.log("User token and expiry saved:", user)
    } catch (saveErr) {
      console.error("Error saving user:", saveErr)
      return res.status(500).json({ msg: "Error saving token" })
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        ciphers: "SSLv3",
      },
    })

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset",
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
             Please click on the following link, or paste this into your browser to complete the process:\n\n
             http://${req.headers.host}/reset-password/${token}\n\n
             If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    }

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error("Error sending email:", err)
        return res.status(500).json({ msg: "Error sending email" })
      }
      res.json({ msg: "Email sent" })
    })
  } catch (err) {
    console.error("Server error:", err)
    res.status(500).json({ msg: "Server error" })
  }
})

// Route to reset the password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user)
      return res.status(400).json({ msg: "Token is invalid or has expired" })

    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(req.body.password, salt)
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.json({ msg: "Password has been reset" })
  } catch (err) {
    console.error("Error resetting password:", err)
    res.status(500).json({ msg: "Server error" })
  }
})

// OAuth2 callback route
router.get("/oauth2/callback", async (req, res) => {
  try {
    const session = await account.getSession(req.query.sessionId)
    const { email, name, googleId } = session.user

    // Check if user already exists
    let user = await User.findOne({ googleId })
    if (!user) {
      // Create a new user
      user = new User({
        username: name,
        email,
        googleId,
        isVerified: true, // Assuming OAuth2 users are verified
      })
      await user.save()
    }

    // Generate JWT
    const payload = { user: { id: user.id } }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 })

    // Redirect to the client with the token
    res.redirect(`https://guidenet.co/dashboard?token=${token}`)
  } catch (err) {
    console.error("OAuth2 callback error:", err)
    res.status(500).send("Server Error")
  }
})

module.exports = router
