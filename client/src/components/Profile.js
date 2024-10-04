import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Avatar,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Grid,
  TextField,
  Snackbar,
} from "@mui/material"
import { styled } from "@mui/material/styles"
import api from "../utils/api"

const Input = styled("input")({
  display: "none",
})

const Profile = ({ userData, onUpdateProfile }) => {
  const [role, setRole] = useState(userData?.role || "")
  const [avatar, setAvatar] = useState(userData?.avatar || "")
  const [mentorData, setMentorData] = useState({
    bio: "",
    expertise: "",
    experience: "",
    company: "",
    availability: "",
    hourlyRate: "",
  })
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
  })

  useEffect(() => {
    if (userData?.avatar) {
      setAvatar(`/api/users/avatar/${userData._id}?${new Date().getTime()}`)
    }
    if (userData?.role === "mentor" && userData?.mentor) {
      fetchMentorData(userData.mentor)
    }
  }, [userData])

  const fetchMentorData = async (mentorId) => {
    try {
      const res = await api.get(`/mentors/${mentorId}`)
      setMentorData(res.data)
    } catch (err) {
      console.error("Error fetching mentor data:", err)
    }
  }

  const handleRoleChange = async (event) => {
    const newRole = event.target.value
    setRole(newRole)
    await onUpdateProfile({ role: newRole })

    if (newRole === "mentor" && !userData.mentor) {
      setMentorData({
        bio: "",
        expertise: "",
        experience: "",
        company: "",
        availability: "",
      })
    }
  }

  const handleMentorDataChange = (event) => {
    setMentorData({ ...mentorData, [event.target.name]: event.target.value })
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const formData = new FormData()
      formData.append("avatar", file)
      onUpdateProfile(formData)

      const localUrl = URL.createObjectURL(file)
      setAvatar(localUrl)
    }
  }

  const handleSaveMentorData = async () => {
    try {
      const res = await api.post("/mentors", mentorData)
      setSnackbar({ open: true, message: "Mentor profile saved successfully!" })
      onUpdateProfile({ ...userData, mentor: res.data._id })
    } catch (err) {
      console.error(
        "Error saving mentor profile:",
        err.response ? err.response.data : err.message
      )
      setSnackbar({
        open: true,
        message: "Error saving mentor profile. Please try again.",
      })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Avatar
              src={avatar}
              alt={userData?.username}
              sx={{ width: 100, height: 100, mb: 2 }}
            />
            <label htmlFor="avatar-upload">
              <Input
                accept="image/*"
                id="avatar-upload"
                type="file"
                onChange={handleAvatarChange}
              />
              <Button variant="outlined" component="span">
                Change Picture
              </Button>
            </label>
          </Box>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography variant="h4" gutterBottom>
            {userData?.username}
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            {userData?.email}
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel id="role-select-label">Role</InputLabel>
            <Select
              labelId="role-select-label"
              id="role-select"
              value={role}
              label="Role"
              onChange={handleRoleChange}
            >
              <MenuItem value="mentee">Mentee</MenuItem>
              <MenuItem value="mentor">Mentor</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {role === "mentor" && (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                value={mentorData.bio}
                onChange={handleMentorDataChange}
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expertise (comma-separated)"
                name="expertise"
                value={mentorData.expertise}
                onChange={handleMentorDataChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Years of Experience"
                name="experience"
                type="number"
                value={mentorData.experience}
                onChange={handleMentorDataChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company"
                name="company"
                value={mentorData.company}
                onChange={handleMentorDataChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Availability"
                name="availability"
                value={mentorData.availability}
                onChange={handleMentorDataChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hourly Rate ($)"
                name="hourlyRate"
                type="number"
                value={mentorData.hourlyRate}
                onChange={handleMentorDataChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveMentorData}
                fullWidth
              >
                Save Mentor Profile
              </Button>
            </Grid>
          </>
        )}
      </Grid>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Paper>
  )
}

export default Profile
