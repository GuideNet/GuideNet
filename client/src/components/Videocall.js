import React, { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Box, Typography, Button } from "@mui/material"
import SimplePeer from "simple-peer"
import io from "socket.io-client"

const VideoCall = () => {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const [peer, setPeer] = useState(null)
  const [stream, setStream] = useState(null)
  const localVideoRef = useRef()
  const remoteVideoRef = useRef()
  const socketRef = useRef()
  const callStartedRef = useRef(false)
  const [isInitiator, setIsInitiator] = useState(false)

  // Define endCall first to avoid ESLint warning
  const endCall = useCallback(() => {
    if (peer) {
      peer.destroy()
      console.log("Peer destroyed")
    }
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop()
        console.log("Media track stopped")
      })
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
      console.log("Local video stream cleared")
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
      console.log("Remote video stream cleared")
    }
    setStream(null)
    setPeer(null)
    socketRef.current.emit("endCall", chatId)
    navigate("/dashboard")
    console.log("Call ended and navigated to dashboard")
  }, [peer, stream, navigate, chatId])

  const startCall = useCallback(async () => {
    if (callStartedRef.current) return

    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      setStream(localStream)
      console.log("Local media stream obtained")

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream
        console.log("Local video stream set")
      }

      const newPeer = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        stream: localStream,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" }, // Adding a STUN server
          ],
        },
      })

      newPeer.on("signal", (signalData) => {
        socketRef.current.emit("videoCallSignal", {
          chatId,
          signal: signalData,
          isInitiator,
        })
        console.log("Signal emitted:", signalData)
      })

      newPeer.on("stream", (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
          console.log("Remote video stream set")
        }
      })

      newPeer.on("error", (err) => {
        console.error("Peer error:", err)
      })

      newPeer.on("close", () => {
        console.log("Peer connection closed")
        endCall()
      })

      setPeer(newPeer)
      callStartedRef.current = true
      console.log("Peer connection established")
    } catch (error) {
      console.error("Error starting video call:", error)
    }
  }, [chatId, isInitiator, endCall])

  useEffect(() => {
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL)
    socketRef.current.emit("joinVideoCall", chatId)
    console.log("Joined video call room:", chatId)

    socketRef.current.on("initiateCall", () => {
      setIsInitiator(true)
      startCall()
      console.log("Received initiateCall event. Starting call as initiator.")
    })

    socketRef.current.on("waitForCall", () => {
      setIsInitiator(false)
      startCall()
      console.log("Received waitForCall event. Starting call as receiver.")
    })

    socketRef.current.on(
      "videoCallSignal",
      ({ signal, isInitiator: remoteIsInitiator }) => {
        if (peer) {
          peer.signal(signal)
          console.log("Received videoCallSignal and signaling peer.")
        } else if (!isInitiator && remoteIsInitiator) {
          // If not initiator and remote is initiator, start call and signal
          startCall()
            .then(() => {
              if (peer) {
                peer.signal(signal)
                console.log("Started call and signaled peer as receiver.")
              }
            })
            .catch((err) => {
              console.error(
                "Error during peer signaling after starting call:",
                err
              )
            })
        }
      }
    )

    socketRef.current.on("callEnded", () => {
      endCall()
      console.log("Received callEnded event. Call has been terminated.")
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        console.log("Socket disconnected.")
      }
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop()
          console.log("Media track stopped during cleanup.")
        })
        console.log("Media streams stopped during cleanup.")
      }
    }
  }, [chatId, startCall, peer, stream, endCall, isInitiator])

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Box display="flex" flexGrow={1}>
        <Box flex={1} position="relative">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <Typography
            variant="h6"
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              padding: "5px 10px",
              borderRadius: "5px",
            }}
          >
            You
          </Typography>
        </Box>
        <Box flex={1} position="relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <Typography
            variant="h6"
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              padding: "5px 10px",
              borderRadius: "5px",
            }}
          >
            Remote User
          </Typography>
        </Box>
      </Box>
      <Box p={2} textAlign="center">
        <Button
          variant="contained"
          onClick={endCall}
          sx={{
            backgroundColor: "#f3c111",
            "&:hover": {
              backgroundColor: "#d9ab0f", // Slightly darker shade for hover effect
            },
            color: "black", // To ensure text is visible on the yellow background
          }}
        >
          End Call
        </Button>
      </Box>
    </Box>
  )
}

export default VideoCall
