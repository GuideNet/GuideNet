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
      setTimeout(() => {
        navigate("/dashboard")
      }, 2000)
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
        "https://app.guidenet.co/Dashboard", // Success URL
        "https://app.guidenet.co/login" // Failure URL
      )
    } catch (error) {
      console.error("Google OAuth error:", error)
      // Handle error (e.g., show an error message to the user)
    }
  }

  return (
    <div className="login-container">
      <h1 className="login-title">Login</h1>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <form className="login-form" onSubmit={onSubmit}>
        <input
          type="email"
          name="email"
          value={email}
          onChange={onChange}
          placeholder="Email"
          className="login-input"
        />
        <input
          type="password"
          name="password"
          value={password}
          onChange={onChange}
          placeholder="Password"
          className="login-input"
        />
        <div className="login-buttons">
          <button type="submit" className="login-button">
            Login
          </button>
          <div className="or-google-login">
            Or{" "}
            <button className="google-link" onClick={handleGoogleLogin}>
              <FcGoogle
                style={{ marginRight: "8px", verticalAlign: "middle" }}
              />
              Login with Google
            </button>
          </div>
        </div>
        <div className="additional-buttons">
          <Link to="/forgot-password">
            <button type="button" className="home-button">
              Forgot Password
            </button>
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
