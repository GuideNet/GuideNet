import React, { useState } from "react"
import axios from "axios"
import { Link, useNavigate } from "react-router-dom"
import "./Register.css" // Import the CSS file

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  })
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showVerification, setShowVerification] = useState(false)

  const { username, email, password } = formData
  const navigate = useNavigate()

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post("/api/auth/register", formData)
      setSuccess(res.data.msg)
      setError("")
      setShowVerification(true)
    } catch (err) {
      console.error("Error Response:", err.response.data)
      setError(
        err.response.data.msg || "An error occurred during registration."
      )
      setSuccess("")
    }
  }

  const onVerify = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post("/api/auth/verify-email", {
        email,
        verificationCode,
      })
      setSuccess(res.data.msg)
      setError("")
      setTimeout(() => navigate("/login"), 3000)
    } catch (err) {
      console.error("Error Response:", err.response.data)
      setError(err.response.data.msg || "Verification failed.")
      setSuccess("")
    }
  }

  return (
    <div className="register-container">
      <h1 className="register-title">Register</h1>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      {!showVerification ? (
        <form className="register-form" onSubmit={onSubmit}>
          <input
            type="text"
            name="username"
            value={username}
            onChange={onChange}
            placeholder="Username"
            className="register-input"
          />
          <input
            type="email"
            name="email"
            value={email}
            onChange={onChange}
            placeholder="Email"
            className="register-input"
          />
          <input
            type="password"
            name="password"
            value={password}
            onChange={onChange}
            placeholder="Password"
            className="register-input"
          />
          <div className="register-buttons">
            <button type="submit" className="register-button">
              Register
            </button>
            <Link to="/">
              <button type="button" className="home-button">
                Back to Home
              </button>
            </Link>
          </div>
        </form>
      ) : (
        <form className="verification-form" onSubmit={onVerify}>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter verification code"
            className="register-input"
          />
          <button type="submit" className="register-button">
            Verify Email
          </button>
        </form>
      )}
    </div>
  )
}

export default Register
