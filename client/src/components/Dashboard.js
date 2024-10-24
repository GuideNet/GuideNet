import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material"
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  AccountCircle,
  Chat,
  Group,
  Explore as ExploreIcon,
} from "@mui/icons-material"
import { useNavigate, useLocation } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import axios from "axios"
import "./Dashboard.css"
import Profile from "./Profile"
import Explore from "./Explore"
import Chats from "./Chats"
import Community from "./Community"
import api from "../utils/api"

const Dashboard = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState("community")
  const [selectedChatUser, setSelectedChatUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [communityPosts, setCommunityPosts] = useState([])
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      const decoded = jwtDecode(token)
      const userId = decoded.user.id
      fetchUserData(userId, token)
      setSelectedSection("community") // Reset to community on initial load
    } else {
      navigate("/login")
    }
  }, [navigate])

  useEffect(() => {
    if (location.state) {
      const { selectedSection: newSection, chatUser } = location.state
      if (newSection) {
        setSelectedSection(newSection)
        localStorage.setItem("selectedSection", newSection) // Save to localStorage
      }
      if (chatUser) {
        setSelectedChatUser(chatUser)
      }
    }
  }, [location])

  const handleSectionChange = (section) => {
    setSelectedSection(section)
    localStorage.setItem("selectedSection", section) // Still save for potential future use
  }

  const fetchUserData = async (userId, token) => {
    try {
      const res = await axios.get(`/api/users/${userId}`, {
        headers: {
          "x-auth-token": token,
        },
      })
      setUserData(res.data)
    } catch (err) {
      console.error("Error fetching user data:", err)
    }
  }

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("selectedSection") // Remove stored section
    navigate("/")
  }

  const handleSearchChange = (event) => {
    console.log("Search input changed:", event.target.value)
    setSearchQuery(event.target.value)
  }

  const handleUpdateProfile = async (updates) => {
    console.log("Updating profile with:", updates)
    const token = localStorage.getItem("token")
    try {
      const res = await api.put("/api/users/profile", updates, {
        headers: {
          "Content-Type":
            updates instanceof FormData
              ? "multipart/form-data"
              : "application/json",
          "x-auth-token": token,
        },
      })
      console.log("Profile update response:", res.data)
      setUserData((prevData) => ({ ...prevData, ...res.data }))
    } catch (err) {
      console.error(
        "Error updating profile:",
        err.response ? err.response.data : err.message
      )
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const res = await api.get("/api/posts")
      setCommunityPosts(res.data)
    } catch (err) {
      console.error("Error fetching posts:", err)
    }
  }

  const handleAddPost = async (newPost) => {
    try {
      const res = await api.post("/api/posts", newPost)

      const fullNewPost = {
        ...res.data,
        author: {
          _id: res.data.author, // Assuming the server sends back the author ID
          username: userData.username, // Make sure userData is available
        },
      }

      setCommunityPosts((prevPosts) => [fullNewPost, ...prevPosts])
    } catch (err) {
      console.error("Error adding post:", err)
    }
  }

  const handleLikePost = async (postId) => {
    try {
      const res = await api.put(`/api/posts/like/${postId}`, {})
      setCommunityPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? { ...post, likes: res.data } : post
        )
      )
    } catch (err) {
      console.error("Error liking post:", err)
    }
  }

  const handleCommentPost = async (postId, commentText) => {
    try {
      const res = await api.post(`/api/posts/comment/${postId}`, {
        text: commentText,
      })

      setCommunityPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? { ...post, comments: [res.data[0], ...post.comments] }
            : post
        )
      )
    } catch (err) {
      console.error("Error commenting on post:", err)
    }
  }

  const handleEditPost = async (updatedPost) => {
    try {
      const res = await api.put(`/api/posts/${updatedPost._id}`, updatedPost)
      setCommunityPosts((prevPosts) =>
        prevPosts.map((p) => (p._id === updatedPost._id ? res.data : p))
      )
    } catch (err) {
      console.error("Error editing post:", err)
    }
  }

  const handleDeletePost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await api.delete(`/api/posts/${postId}`)
        setCommunityPosts((prevPosts) =>
          prevPosts.filter((post) => post._id !== postId)
        )
      } catch (err) {
        console.error("Error deleting post:", err)
      }
    }
  }

  const filteredPosts = Array.isArray(communityPosts)
    ? communityPosts.filter(
        (post) =>
          post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const renderContent = () => {
    switch (selectedSection) {
      case "profile":
        return (
          <Profile userData={userData} onUpdateProfile={handleUpdateProfile} />
        )
      case "explore":
        return <Explore />
      case "chat":
        return <Chats userData={userData} selectedUser={selectedChatUser} /> // Pass userData to Chats
      case "community":
      default:
        return (
          <Community
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            communityPosts={filteredPosts}
            onAddPost={handleAddPost}
            onLikePost={handleLikePost}
            onCommentPost={handleCommentPost}
            currentUser={userData}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
          />
        )
    }
  }

  if (!userData) {
    return (
      <Box textAlign="center" mt="50px">
        <CircularProgress size="xl" />
        <Typography mt="20px">Loading...</Typography>
      </Box>
    )
  }

  return (
    <Box display="flex">
      <AppBar position="fixed" sx={{ bgcolor: "#F3C111" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
            sx={{ color: "#F3C111" }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            <ListItem button onClick={() => handleSectionChange("profile")}>
              <ListItemIcon sx={{ color: "#F3C111" }}>
                <AccountCircle />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
            <ListItem button onClick={() => handleSectionChange("explore")}>
              <ListItemIcon sx={{ color: "#F3C111" }}>
                <ExploreIcon />
              </ListItemIcon>
              <ListItemText primary="Explore" />
            </ListItem>
            <ListItem button onClick={() => handleSectionChange("chat")}>
              <ListItemIcon sx={{ color: "#F3C111" }}>
                <Chat />
              </ListItemIcon>
              <ListItemText primary="Chat" />
            </ListItem>
            <ListItem button onClick={() => handleSectionChange("community")}>
              <ListItemIcon sx={{ color: "#F3C111" }}>
                <Group />
              </ListItemIcon>
              <ListItemText primary="Community" />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon sx={{ color: "#F3C111" }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}
      >
        <Toolbar />
        {renderContent()}
      </Box>
    </Box>
  )
}

export default Dashboard
