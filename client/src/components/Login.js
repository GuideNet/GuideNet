import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FcGoogle } from "react-icons/fc" // Import Google icon
import "./Login.css" // Import the CSS file
import api from "../utils/api" // Use the api instance
import { account } from "../utils/appwrite"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { email, password } = formData
  const navigate = useNavigate()

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post("/api/auth/login", formData)
      console.log(res.data) // Token received
      localStorage.setItem("token", res.data.token)
      setSuccess("Login successful! Redirecting to dashboard...")
      setError("")
      navigate("/dashboard")
    } catch (err) {
      console.error(err.response.data)
      if (
        err.response.data.msg === "Please verify your email before logging in"
      ) {
        setError(
          "Please verify your email before logging in. Check your inbox for the verification code."
        )
      } else {
        setError("Invalid credentials. Please check your email and password.")
      }
      setSuccess("")
    }
  }

  const handleGoogleLogin = async (e) => {
    e.preventDefault()
    try {
      await account.createOAuth2Session(
        "google",
        "https://guidenet.co/api/auth/oauth2/callback", // Success URL
        "https://guidenet.co/login" // Failure URL
      )
    } catch (error) {
      console.error("Google OAuth error:", error)
      // Handle error (e.g., show an error message to the user)
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={onSubmit} className="login-form">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            placeholder="Email Address"
            name="email"
            value={email}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={password}
            onChange={onChange}
            minLength="6"
            required
          />
        </div>
        <input type="submit" className="btn btn-primary" value="Login" />
        <button onClick={handleGoogleLogin} className="google-btn">
          <FcGoogle /> Login with Google
        </button>
        <div className="links-container">
          <Link to="/register" className="register-link">
            Don't have an account? Sign Up
          </Link>
          <Link to="/forgot-password" className="forgot-password-link">
            Forgot Password?
          </Link>
          <Link to="/">
            <button type="button" className="home-button">
              Back to Home
            </button>
          </Link>
        </div>
      </form>
    </div>
  )
}

export default Login
