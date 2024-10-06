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
  const [selectedSection, setSelectedSection] = useState(
    localStorage.getItem("selectedSection") || "community"
  )
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
    }
  }, [])

  useEffect(() => {
    if (location.state) {
      const { selectedSection: newSection, chatUser } = location.state
      console.log("Dashboard - location state:", location.state)
      if (newSection) {
        setSelectedSection(newSection)
        localStorage.setItem("selectedSection", newSection) // Save to localStorage
        console.log("Dashboard - new selected section:", newSection)
      }
      if (chatUser) {
        setSelectedChatUser(chatUser)
        console.log("Dashboard - new selected chat user:", chatUser)
      }
    }
  }, [location])

  const handleSectionChange = (section) => {
    setSelectedSection(section)
    localStorage.setItem("selectedSection", section) // Save to localStorage
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
    navigate("/")
  }

  const handleSearchChange = (event) => {
    console.log("Search input changed:", event.target.value)
    setSearchQuery(event.target.value)
  }

  const handleUpdateProfile = async (updates) => {
    console.log("Updating profile with:", updates)
    try {
      const res = await axios.put("/api/users/profile", updates, {
        headers: {
          "Content-Type":
            updates instanceof FormData
              ? "multipart/form-data"
              : "application/json",
          "x-auth-token": localStorage.getItem("token"),
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
      const res = await api.get("/posts")
      setCommunityPosts(res.data)
    } catch (err) {
      console.error("Error fetching posts:", err)
    }
  }

  const handleAddPost = async (newPost) => {
    try {
      const res = await api.post("/posts", newPost)

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
      const res = await api.put(`/posts/like/${postId}`, {})
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
      const res = await api.post(`/posts/comment/${postId}`, {
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

  const filteredPosts = communityPosts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <ListItem button onClick={toggleDrawer}>
              <ListItemIcon sx={{ color: "#F3C111" }}>
                <MenuIcon />
              </ListItemIcon>
              <ListItemText primary="Menu" />
            </ListItem>
            {drawerOpen && (
              <ListItem button onClick={handleLogout}>
                <ListItemIcon sx={{ color: "#F3C111" }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItem>
            )}
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
