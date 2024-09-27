const express = require("express")
const router = express.Router()
const auth = require("../middleware/authMiddleware")
const User = require("../models/User")
const Chat = require("../models/Chat")

// @route   GET api/chats
// @desc    Get all chats for the current user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const chats = await Chat.find({ "participants.user": req.user.id })
      .populate("participants.user", "username")
      .populate("messages.sender", "username")
      .sort({ updatedAt: -1 })
    res.json(chats)
  } catch (err) {
    res.status(500).send("Server Error")
  }
})

// @route   POST api/chats
// @desc    Create a new chat
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { participantId } = req.body
    console.log("Server - Creating chat with participantId:", participantId)

    const currentUser = await User.findById(req.user.id)
    const participant = await User.findById(participantId)

    if (!currentUser || !participant) {
      return res.status(404).json({ msg: "User not found" })
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      "participants.user": { $all: [req.user.id, participantId] },
    })

    if (existingChat) {
      console.log("Server - Existing chat found:", existingChat)
      return res.json(existingChat)
    }

    const newChat = new Chat({
      participants: [
        { user: req.user.id, username: currentUser.username },
        { user: participantId, username: participant.username },
      ],
      messages: [],
    })

    const chat = await newChat.save()
    console.log("Server - New chat created:", chat)
    res.json(chat)
  } catch (err) {
    console.error("Server - Error creating chat:", err.message)
    res.status(500).send("Server Error")
  }
})

// @route   POST api/chats/:id/messages
// @desc    Send a message in a chat
// @access  Private
router.post("/:id/messages", auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
    if (!chat) {
      return res.status(404).json({ msg: "Chat not found" })
    }

    const newMessage = {
      sender: req.user.id,
      senderUsername: req.user.username, // Ensure username is available
      content: req.body.content,
    }

    chat.messages.push(newMessage)
    chat.updatedAt = Date.now()
    await chat.save()

    const populatedChat = await Chat.findById(chat._id)
      .populate("participants.user", "username")
      .populate("messages.sender", "username")

    res.json(populatedChat)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

module.exports = router
