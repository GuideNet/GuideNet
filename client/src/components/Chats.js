import React, { useState, useEffect, useRef } from "react"
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
  Dialog,
  DialogTitle,
  DialogContent,
  AppBar,
  Toolbar,
} from "@mui/material"
import VideoCallIcon from "@mui/icons-material/VideoCall"
import CloseIcon from "@mui/icons-material/Close"
import axios from "axios"
import SimplePeer from "simple-peer"
import io from "socket.io-client"

const Chats = ({ selectedUser, userData }) => {
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [message, setMessage] = useState("")
  const [peer, setPeer] = useState(null)
  const [stream, setStream] = useState(null)
  const [videoCallOpen, setVideoCallOpen] = useState(false)
  const [callState, setCallState] = useState({
    receivingCall: false,
    callAccepted: false,
    callerSignal: null,
    callerId: null,
  })

  const localVideoRef = useRef()
  const remoteVideoRef = useRef()
  const socketRef = useRef()

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
    socketRef.current = io("http://localhost:5000") // Replace with your server URL

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

    const handleCallUser = ({ signal, from }) => {
      console.log(`Incoming call from ${from}`)
      setCallState({
        receivingCall: true,
        callerSignal: signal,
        callerId: from,
      })
    }

    const handleCallAccepted = (signal) => {
      console.log("Call accepted")
      setCallState((prevState) => ({
        ...prevState,
        callAccepted: true,
      }))
      if (peer) {
        peer.signal(signal)
      }
    }

    // Attach event listeners
    socketRef.current.on("message", handleMessage)
    socketRef.current.on("callUser", handleCallUser)
    socketRef.current.on("callAccepted", handleCallAccepted)

    // Join the chat room
    if (selectedChat) {
      socketRef.current.emit("joinChat", selectedChat._id)
      console.log(`Joined chat room: ${selectedChat._id}`)
    }

    return () => {
      // Clean up event listeners
      socketRef.current.off("message", handleMessage)
      socketRef.current.off("callUser", handleCallUser)
      socketRef.current.off("callAccepted", handleCallAccepted)
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [selectedChat, userData._id, peer]) // Added 'peer' to the dependency array

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

  const initiateVideoCall = async () => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      setStream(localStream)

      const newPeer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: localStream,
      })

      newPeer.on("signal", (signalData) => {
        const calleeId = selectedChat.participants.find(
          (p) => p._id !== userData._id
        )._id

        console.log("Initiating call to user ID:", calleeId)

        // Send signal data to the callee via Socket.io
        socketRef.current.emit("callUser", {
          userToCall: calleeId,
          signal: signalData,
          from: userData._id,
        })
      })

      newPeer.on("stream", (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
          console.log("Remote stream assigned to remoteVideoRef")
        }
      })

      setPeer(newPeer)
      setVideoCallOpen(true)

      // Assign the local stream to the local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream
        console.log("Local stream assigned to localVideoRef")
      }
    } catch (error) {
      console.error("Error initiating video call:", error)
      alert("Error initiating video call: " + error.message)
    }
  }

  const acceptCall = async () => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      setStream(localStream)

      const newPeer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream: localStream,
      })

      newPeer.on("signal", (signalData) => {
        // Send signal data back to the caller via Socket.io
        socketRef.current.emit("acceptCall", {
          signal: signalData,
          to: callState.callerId,
        })
      })

      newPeer.on("stream", (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
          console.log("Remote stream assigned to remoteVideoRef")
        }
      })

      newPeer.signal(callState.callerSignal)
      setPeer(newPeer)
      setCallState((prevState) => ({
        ...prevState,
        callAccepted: true,
        receivingCall: false,
      }))
      setVideoCallOpen(true)

      // Assign the local stream to the local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream
        console.log("Local stream assigned to localVideoRef")
      }
    } catch (error) {
      console.error("Error accepting call:", error)
      alert("Error accepting call: " + error.message)
    }
  }

  const closeVideoCall = () => {
    setVideoCallOpen(false)
    if (peer) {
      peer.destroy()
      setPeer(null)
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
    setCallState({
      receivingCall: false,
      callAccepted: false,
      callerSignal: null,
      callerId: null,
    })
  }

  // Get the remote user's information
  const remoteUser =
    selectedChat &&
    selectedChat.participants.find((p) => p._id !== userData._id)

  return (
    <Box display="flex">
      {/* Existing Chat UI */}
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
              <IconButton
                onClick={initiateVideoCall}
                disabled={videoCallOpen || callState.receivingCall}
              >
                <VideoCallIcon sx={{ color: "#F3C111" }} />
              </IconButton>
            </Box>
            <Box height="60vh" overflow="auto" mb={2}>
              {selectedChat.messages.map((msg) => (
                <Box key={msg._id} display="flex" alignItems="center" mb={1}>
                  <Avatar
                    src={`/api/users/avatar/${msg.sender._id}`}
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
              ))}
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

      {/* Video Call Dialog */}
      <Dialog fullScreen open={videoCallOpen} onClose={closeVideoCall}>
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={closeVideoCall}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Video Call with {remoteUser && remoteUser.username}
            </Typography>
            <Button autoFocus color="inherit" onClick={closeVideoCall}>
              End Call
            </Button>
          </Toolbar>
        </AppBar>
        <Box display="flex" height="100%">
          <Box flex={1} position="relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            ></video>
            <Typography
              variant="h6"
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                color: "white",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                padding: "5px 10px",
                borderRadius: "5px",
              }}
            >
              {userData.username}
            </Typography>
          </Box>
          <Box flex={1} position="relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            ></video>
            <Typography
              variant="h6"
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                color: "white",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                padding: "5px 10px",
                borderRadius: "5px",
              }}
            >
              {remoteUser && remoteUser.username}
            </Typography>
          </Box>
        </Box>
      </Dialog>

      {/* Incoming Call Notification */}
      {callState.receivingCall && !callState.callAccepted && (
        <Dialog
          open={true}
          onClose={() =>
            setCallState((prevState) => ({
              ...prevState,
              receivingCall: false,
            }))
          }
        >
          <DialogTitle>Incoming Video Call</DialogTitle>
          <DialogContent>
            <Typography>{`${
              selectedChat.participants.find(
                (p) => p._id === callState.callerId
              ).username
            } is calling you.`}</Typography>
            <Box mt={2} display="flex" justifyContent="space-between">
              <Button variant="contained" onClick={acceptCall}>
                Accept
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  setCallState((prevState) => ({
                    ...prevState,
                    receivingCall: false,
                  }))
                }
              >
                Decline
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  )
}

export default Chats
