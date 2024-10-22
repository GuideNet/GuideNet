import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Modal,
  Grid,
} from "@mui/material"
import {
  ThumbUp,
  Comment,
  Add as AddIcon,
  Search,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material"
import AuthorDetailsPopup from "./AuthorDetailsPopup"
import api from "../utils/api"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"

const Community = ({
  searchQuery,
  handleSearchChange,
  communityPosts,
  onAddPost,
  onLikePost,
  onCommentPost,
  currentUser,
}) => {
  const [open, setOpen] = useState(false)
  const [newPost, setNewPost] = useState({ title: "", content: "" })
  const [commentText, setCommentText] = useState("")
  const [activeCommentPost, setActiveCommentPost] = useState(null)
  const [selectedAuthor, setSelectedAuthor] = useState(null)
  const [authorPopupOpen, setAuthorPopupOpen] = useState(false)
  const [expandedPosts, setExpandedPosts] = useState({})
  const MAX_HEIGHT = 150 // Maximum height for collapsed posts in pixels

  useEffect(() => {}, [searchQuery, communityPosts])

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const handleNewPostChange = (name, value) => {
    setNewPost((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    onAddPost(newPost)
    setNewPost({ title: "", content: "" })
    handleClose()
  }

  const handleSubmitComment = (postId) => {
    onCommentPost(postId, commentText)
    setCommentText("")
    setActiveCommentPost(null)
  }

  const handleAuthorClick = async (author) => {
    console.log("Author clicked:", author)
    try {
      let completeAuthorDetails
      // No need to manually set headers as api intercepts and attaches the token
      // First, try to fetch mentor details
      try {
        console.log("Attempting to fetch mentor details")
        const mentorResponse = await api.get(`/mentors/user/${author._id}`)
        console.log("Mentor API response:", mentorResponse.data)
        completeAuthorDetails = {
          ...mentorResponse.data,
          username: author.username,
          _id: author._id,
          role: "mentor",
        }
      } catch (mentorError) {
        console.log(
          "Not a mentor or error fetching mentor details:",
          mentorError
        )
        // If not a mentor, fetch user details
        console.log("Fetching user details")
        const userResponse = await api.get(`/users/${author._id}`)
        console.log("User API response:", userResponse.data)
        completeAuthorDetails = {
          ...userResponse.data,
          role: "mentee",
        }
      }

      console.log("Complete author details:", completeAuthorDetails)
      setSelectedAuthor(completeAuthorDetails)
      setAuthorPopupOpen(true)
    } catch (error) {
      console.error("Error fetching author details:", error)
      console.log("Fallback: Using available author information")
      setSelectedAuthor({ ...author, role: "mentee" })
      setAuthorPopupOpen(true)
    }
  }

  const togglePostExpansion = (postId) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }))
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => {
                handleSearchChange(e)
              }}
              InputProps={{
                startAdornment: <Search />,
              }}
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpen}
              sx={{ bgcolor: "#F3C111", color: "white" }}
            >
              New Post
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Modal open={open} onClose={handleClose}>
        <Paper
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            p: 4,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Create New Post
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Title"
            name="title"
            value={newPost.title}
            onChange={(e) => handleNewPostChange("title", e.target.value)}
            sx={{ mb: 2 }}
          />
          <ReactQuill
            value={newPost.content}
            onChange={(value) => handleNewPostChange("content", value)}
            style={{ height: "200px", marginBottom: "20px" }}
          />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button onClick={handleClose} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{ bgcolor: "#F3C111", color: "white" }}
            >
              Post
            </Button>
          </Box>
        </Paper>
      </Modal>

      <Grid container spacing={2}>
        {communityPosts.map((post) => {
          const isExpanded = expandedPosts[post._id]
          const isLongPost = post.content.length > 300 // Adjust this threshold as needed

          return (
            <Grid item xs={12} sm={6} md={4} key={post._id}>
              <Paper
                elevation={2}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ p: 2, flexGrow: 1 }}>
                  <ListItem alignItems="flex-start" disableGutters>
                    <ListItemAvatar>
                      <Avatar
                        src={`/api/users/avatar/${post.author._id}`}
                        alt={post.author.username}
                        onClick={() => handleAuthorClick(post.author)}
                        sx={{ cursor: "pointer" }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="h6" component="div" gutterBottom>
                          {post.title}
                        </Typography>
                      }
                      secondary={
                        <Box
                          sx={{
                            maxHeight:
                              isLongPost && !isExpanded ? MAX_HEIGHT : "none",
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                            sx={{ cursor: "pointer" }}
                            onClick={() => {
                              setSelectedAuthor(post.author)
                              setAuthorPopupOpen(true)
                            }}
                          >
                            {post.author.username}
                          </Typography>
                          {" — "}
                          <Typography
                            component="div"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                          />
                          {isLongPost && !isExpanded && (
                            <Box
                              sx={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                width: "100%",
                                height: "50px",
                                background:
                                  "linear-gradient(transparent, white)",
                              }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </Box>
                <Box sx={{ p: 2 }}>
                  {isLongPost && (
                    <Button
                      onClick={() => togglePostExpansion(post._id)}
                      endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      {isExpanded ? "Collapse" : "Read more"}
                    </Button>
                  )}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <IconButton onClick={() => onLikePost(post._id)}>
                        <ThumbUp
                          color={
                            post.likes &&
                            currentUser &&
                            post.likes.includes(currentUser._id)
                              ? "primary"
                              : "inherit"
                          }
                        />
                      </IconButton>
                      <Typography component="span">
                        {post.likes ? post.likes.length : 0} likes
                      </Typography>
                      <IconButton
                        onClick={() => setActiveCommentPost(post._id)}
                      >
                        <Comment />
                      </IconButton>
                      <Typography component="span">
                        {post.comments ? post.comments.length : 0} comments
                      </Typography>
                    </Box>
                    <Typography variant="caption">
                      {new Date(post.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          )
        })}
      </Grid>

      <AuthorDetailsPopup
        open={authorPopupOpen}
        onClose={() => setAuthorPopupOpen(false)}
        author={selectedAuthor}
      />
    </Box>
  )
}

export default Community
