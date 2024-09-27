const express = require("express")
const router = express.Router()
const auth = require("../middleware/authMiddleware")
const Post = require("../models/Post")
const User = require("../models/User")

// @route   GET api/posts
// @desc    Get all posts
// @access  Public
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "username avatar")
      .populate("comments.user", "username avatar")
    res.json(posts)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

// @route   POST api/posts
// @desc    Create a new post
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { title, content } = req.body
    const newPost = new Post({
      title,
      content,
      author: req.user.id,
    })
    const post = await newPost.save()
    res.json(post)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

// @route   PUT api/posts/like/:id
// @desc    Like or unlike a post
// @access  Private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    // Check if the post has already been liked
    if (post.likes.includes(req.user.id)) {
      // Unlike the post
      post.likes = post.likes.filter((like) => like.toString() !== req.user.id)
    } else {
      // Like the post
      post.likes.unshift(req.user.id)
    }

    await post.save()

    res.json(post.likes)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.post("/comment/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    const newComment = {
      text: req.body.text,
      user: req.user.id,
      username: user.username,
      avatar: user.avatar, // Assuming you have an avatar field in your User model
    }

    post.comments.unshift(newComment)
    await post.save()

    res.json(post.comments)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

module.exports = router
