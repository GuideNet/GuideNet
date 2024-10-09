import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Avatar,
  IconButton,
} from "@mui/material"
import VideoCallIcon from "@mui/icons-material/VideoCall"
import axios from "axios"
import io from "socket.io-client"
import { useNavigate } from "react-router-dom"

const Chats = ({ selectedUser, userData }) => {
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [message, setMessage] = useState("")
  const socketRef = React.useRef()
  const navigate = useNavigate()

  useEffect(() => {
    fetchChats()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      createOrSelectChat(selectedUser)
    }
  }, [selectedUser])

  useEffect(() => {
    // Initialize Socket.io
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL)

    // Register the user after the socket connection is established
    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id)
      console.log("Registering user with ID:", userData._id)
      socketRef.current.emit("registerUser", userData._id)
    })

    // Event handlers
    const handleMessage = (newMessage) => {
      setSelectedChat((prevChat) => ({
        ...prevChat,
        messages: [...prevChat.messages, newMessage],
      }))
    }

    // Attach event listeners
    socketRef.current.on("message", handleMessage)

    // Join the chat room
    if (selectedChat) {
      socketRef.current.emit("joinChat", selectedChat._id)
      console.log(`Joined chat room: ${selectedChat._id}`)
    }

    return () => {
      // Clean up event listeners
      socketRef.current.off("message", handleMessage)
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [selectedChat, userData._id])

  const fetchChats = async () => {
    try {
      const response = await axios.get("/api/chats", {
        headers: { "x-auth-token": localStorage.getItem("token") },
      })
      setChats(response.data)
    } catch (error) {
      console.error("Error fetching chats:", error)
    }
  }

  const createOrSelectChat = async (user) => {
    try {
      const response = await axios.post(
        "/api/chats",
        { participantId: user._id },
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      )
      const newChat = response.data
      setChats((prevChats) => {
        if (!prevChats.find((chat) => chat._id === newChat._id)) {
          return [...prevChats, newChat]
        }
        return prevChats
      })
      setSelectedChat(newChat)
    } catch (error) {
      console.error("Error creating or selecting chat:", error)
    }
  }

  const sendMessage = async () => {
    if (!selectedChat || !message.trim()) return

    try {
      const response = await axios.post(
        `/api/chats/${selectedChat._id}/messages`,
        {
          content: message,
        },
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      )
      setMessage("")
      setSelectedChat(response.data)

      // Emit the new message to the chat room
      socketRef.current.emit("sendMessage", {
        chatId: selectedChat._id,
        message: response.data.messages.slice(-1)[0],
      })
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const initiateVideoCall = () => {
    if (selectedChat) {
      navigate(`/video-call/${selectedChat._id}`)
    }
  }

  return (
    <Box display="flex">
      <Box width="30%" borderRight={1} borderColor="divider">
        <Typography variant="h6" p={2}>
          Chats
        </Typography>
        <List>
          {chats.map((chat) => (
            <ListItem
              button
              key={chat._id}
              onClick={() => setSelectedChat(chat)}
              selected={selectedChat && selectedChat._id === chat._id}
            >
              <ListItemText
                primary={`Chat: ${chat.participants
                  .map((p) => p.username)
                  .join(", ")}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box width="70%" p={2}>
        {selectedChat ? (
          <>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6" mb={2}>
                Chat:{" "}
                {selectedChat.participants.map((p) => p.username).join(" and ")}
              </Typography>
              <IconButton onClick={initiateVideoCall}>
                <VideoCallIcon sx={{ color: "#F3C111" }} />
              </IconButton>
            </Box>
            <Box height="60vh" overflow="auto" mb={2}>
              {selectedChat.messages.map((msg) => {
                const avatarUrl = msg.sender._id
                  ? `/api/users/avatar/${msg.sender._id}`
                  : `/api/users/avatar/${msg.sender}`

                return (
                  <Box key={msg._id} display="flex" alignItems="center" mb={1}>
                    <Avatar
                      src={avatarUrl}
                      alt={msg.senderUsername}
                      sx={{ width: 30, height: 30, mr: 1 }}
                    />
                    <Box>
                      <Typography>
                        {msg.senderUsername}: {msg.content}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(msg.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                )
              })}
            </Box>
            <Box display="flex">
              <TextField
                fullWidth
                variant="outlined"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message"
              />
              <Button variant="contained" onClick={sendMessage}>
                Send
              </Button>
            </Box>
          </>
        ) : (
          <Typography>Select a chat or start a new conversation</Typography>
        )}
      </Box>
    </Box>
  )
}

export default Chats
