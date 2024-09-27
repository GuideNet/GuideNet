const express = require("express")
const router = express.Router()
const auth = require("../middleware/authMiddleware")
const User = require("../models/User")
const Mentor = require("../models/Mentor")

// @route   GET api/mentors
// @desc    Get all mentors
// @access  Public
router.get("/", async (req, res) => {
  try {
    const mentors = await Mentor.find().populate("user", ["username", "avatar"])
    res.json(mentors)
  } catch (err) {
    console.error("Error fetching mentors:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   POST api/mentors
// @desc    Create or update mentor profile
// @access  Private
router.post("/", auth, async (req, res) => {
  const { bio, expertise, experience, company, availability, hourlyRate } =
    req.body

  try {
    let user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    let mentor = await Mentor.findOne({ user: req.user.id })

    if (mentor) {
      // Update
      mentor = await Mentor.findOneAndUpdate(
        { user: req.user.id },
        {
          $set: {
            bio,
            expertise,
            experience,
            company,
            availability,
            hourlyRate,
          },
        },
        { new: true }
      )
    } else {
      // Create
      mentor = new Mentor({
        user: req.user.id,
        bio,
        expertise,
        experience,
        company,
        availability,
        hourlyRate,
      })

      await mentor.save()
    }

    // Update user role and add mentor reference
    user.role = "mentor"
    user.mentor = mentor._id
    await user.save()

    res.json(mentor)
  } catch (err) {
    console.error("Error in /api/mentors POST route:", err)
    res.status(500).json({ error: err.message })
  }
})

// @route   GET api/mentors/:id
// @desc    Get mentor by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id)
    if (!mentor) {
      return res.status(404).json({ msg: "Mentor not found" })
    }
    res.json(mentor)
  } catch (err) {
    console.error("Error in GET /api/mentors/:id", err.message)
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Mentor not found" })
    }
    res.status(500).send("Server Error")
  }
})

// @route   GET api/mentors/user/:userId
// @desc    Get mentor by user ID
// @access  Private
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const mentor = await Mentor.findOne({ user: req.params.userId })
    if (!mentor) {
      return res.status(404).json({ msg: "Mentor not found" })
    }
    res.json(mentor)
  } catch (err) {
    console.error("Error in GET /api/mentors/user/:userId", err.message)
    res.status(500).send("Server Error")
  }
})

module.exports = router
