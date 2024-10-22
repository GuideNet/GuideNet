import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  List,
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
  Send,
  Add as AddIcon,
  Search,
} from "@mui/icons-material"
import AuthorDetailsPopup from "./AuthorDetailsPopup"
import axios from "axios"
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

  useEffect(() => {}, [searchQuery, communityPosts])

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const handleNewPostChange = (e) => {
    const { name, value } = e.target
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
      const token = localStorage.getItem("token")
      const config = {
        headers: { "x-auth-token": token },
      }

      try {
        console.log("Attempting to fetch mentor details")
        const mentorResponse = await axios.get(
          `/api/mentors/user/${author._id}`,
          config
        )
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
        console.log("Fetching user details")
        const userResponse = await axios.get(`/api/users/${author._id}`, config)
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

  const handleExpandPost = (postId) => {
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }))
  }

  return (
    <>
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
            width: 400,
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
            onChange={handleNewPostChange}
            sx={{ mb: 2 }}
          />
          <ReactQuill
            value={newPost.content}
            onChange={(content) => setNewPost((prev) => ({ ...prev, content }))}
            placeholder="Content"
            modules={{
              toolbar: [
                [{ header: [1, 2, false] }],
                ["bold", "italic", "underline", "strike", "blockquote"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image"],
                ["clean"],
              ],
            }}
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

      <List>
        {communityPosts.map((post) => {
          const isExpanded = expandedPosts[post._id]
          const isLongPost = post.content.length > 300 // Adjust this threshold as needed

          return (
            <Paper key={post._id} elevation={2} sx={{ mb: 2, p: 2 }}>
              <ListItem alignItems="flex-start">
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
                    <Typography variant="h5" component="div" gutterBottom>
                      {post.title}
                    </Typography>
                  }
                  secondary={
                    <React.Fragment>
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
                        dangerouslySetInnerHTML={{
                          __html: isExpanded
                            ? post.content
                            : post.content.slice(0, 300) + "...",
                        }}
                      />
                      {isLongPost && (
                        <Button onClick={() => handleExpandPost(post._id)}>
                          {isExpanded ? "Show Less" : "Show More"}
                        </Button>
                      )}
                    </React.Fragment>
                  }
                />
              </ListItem>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mt={1}
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
                    onClick={() =>
                      setActiveCommentPost(
                        post._id === activeCommentPost ? null : post._id
                      )
                    }
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
              {activeCommentPost === post._id && (
                <Box display="flex" mt={2}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    size="small"
                  />
                  <IconButton onClick={() => handleSubmitComment(post._id)}>
                    <Send />
                  </IconButton>
                </Box>
              )}
              {post.comments && post.comments.length > 0 && (
                <List>
                  {post.comments.map((comment, index) => {
                    const avatarSrc =
                      comment.user && comment.user._id
                        ? `/api/users/avatar/${comment.user._id}`
                        : `/api/users/avatar/${comment.user}`
                    return (
                      <ListItem key={index} alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar src={avatarSrc} alt={comment.username} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={comment.username}
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {new Date(comment.date).toLocaleString()} -
                              </Typography>
                              {" " + comment.text}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                    )
                  })}
                </List>
              )}
            </Paper>
          )
        })}
      </List>
      <AuthorDetailsPopup
        open={authorPopupOpen}
        onClose={() => setAuthorPopupOpen(false)}
        author={selectedAuthor}
      />
    </>
  )
}

export default Community
