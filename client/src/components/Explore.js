import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
} from "@mui/material"
import { Search } from "@mui/icons-material"
import axios from "axios"
import { useNavigate } from "react-router-dom"

const Explore = () => {
  const navigate = useNavigate()
  const [mentors, setMentors] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMentor, setSelectedMentor] = useState(null)

  useEffect(() => {
    fetchMentors()
  }, [])

  const fetchMentors = async () => {
    try {
      const res = await axios.get("/api/mentors")
      setMentors(res.data)
    } catch (err) {
      console.error("Error fetching mentors:", err)
    }
  }

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value)
  }

  const filteredMentors = mentors.filter(
    (mentor) =>
      mentor.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.expertise.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mentor.company &&
        mentor.company.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleMentorClick = (mentor) => {
    setSelectedMentor(mentor)
  }

  const handleCloseDialog = () => {
    setSelectedMentor(null)
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Explore Mentors
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search mentors by name, expertise, or company..."
        value={searchQuery}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: <Search />,
        }}
        sx={{ mb: 3 }}
      />
      <Grid container spacing={3}>
        {filteredMentors.map((mentor) => (
          <Grid item xs={12} sm={6} md={4} key={mentor._id}>
            <Card
              onClick={() => handleMentorClick(mentor)}
              sx={{ cursor: "pointer" }}
            >
              <CardMedia
                component="div"
                sx={{
                  height: 140,
                  backgroundColor: "grey.300",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Avatar
                  src={`/api/users/avatar/${mentor.user._id}`}
                  alt={mentor.user.username}
                  sx={{ width: 100, height: 100 }}
                />
              </CardMedia>
              <CardContent>
                <Typography variant="h6" component="div">
                  {mentor.user.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expertise: {mentor.expertise}
                </Typography>
                {mentor.company && (
                  <Typography variant="body2" color="text.secondary">
                    Company: {mentor.company}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  Experience: {mentor.experience} years
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog
        open={!!selectedMentor}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>About Me</DialogTitle>
        <DialogContent>
          {selectedMentor && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  src={`/api/users/avatar/${selectedMentor.user._id}`}
                  alt={selectedMentor.user.username}
                  sx={{ width: 100, height: 100, mr: 2 }}
                />
                <Typography variant="h5">
                  {selectedMentor.user.username}
                </Typography>
              </Box>
              <Typography variant="body1" gutterBottom>
                Expertise: {selectedMentor.expertise}
              </Typography>
              {selectedMentor.company && (
                <Typography variant="body1" gutterBottom>
                  Company: {selectedMentor.company}
                </Typography>
              )}
              <Typography variant="body1" gutterBottom>
                Experience: {selectedMentor.experience} years
              </Typography>
              {selectedMentor.bio && (
                <Typography variant="body1" gutterBottom>
                  Bio: {selectedMentor.bio}
                </Typography>
              )}
              {selectedMentor.hourlyRate && (
                <Typography variant="body1" gutterBottom>
                  Hourly Rate: ${selectedMentor.hourlyRate}
                </Typography>
              )}
              {selectedMentor.availability && (
                <Typography variant="body1" gutterBottom>
                  Availability:{" "}
                  {Array.isArray(selectedMentor.availability)
                    ? selectedMentor.availability.join(", ")
                    : selectedMentor.availability}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              navigate("/dashboard", {
                state: {
                  selectedSection: "chat",
                  chatUser: selectedMentor.user,
                },
              })
              handleCloseDialog()
            }}
          >
            Book a Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Explore
