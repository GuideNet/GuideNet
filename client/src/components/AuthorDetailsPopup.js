import React from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Avatar,
  Box,
} from "@mui/material"
import { useNavigate } from "react-router-dom"

const AuthorDetailsPopup = ({ open, onClose, author }) => {
  const navigate = useNavigate()

  const handleMessageClick = () => {
    onClose()
    navigate("/dashboard", {
      state: { selectedSection: "chat", chatUser: author },
    })
  }

  if (!author) return null

  const isMentor = author.role === "mentor"

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>About {author.username}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar
            src={`/api/users/avatar/${author._id}`}
            alt={author.username}
            sx={{ width: 100, height: 100, mr: 2 }}
          />
          <Box>
            <Typography variant="h5">{author.username}</Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Role: {author.role || "Mentee"}
            </Typography>
          </Box>
        </Box>

        {isMentor && (
          <>
            <Typography variant="body1" gutterBottom>
              Role: Mentor
            </Typography>
            {author.bio && (
              <Typography variant="body1" gutterBottom>
                Bio: {author.bio}
              </Typography>
            )}
            {author.expertise && (
              <Typography variant="body1" gutterBottom>
                Expertise: {author.expertise}
              </Typography>
            )}
            {author.experience && (
              <Typography variant="body1" gutterBottom>
                Experience: {author.experience} years
              </Typography>
            )}
            {author.company && (
              <Typography variant="body1" gutterBottom>
                Company: {author.company}
              </Typography>
            )}
            {author.hourlyRate && (
              <Typography variant="body1" gutterBottom>
                Hourly Rate: ${author.hourlyRate}
              </Typography>
            )}
            {author.availability && (
              <Typography variant="body1" gutterBottom>
                Availability: {author.availability}
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleMessageClick}
        >
          Message
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AuthorDetailsPopup
