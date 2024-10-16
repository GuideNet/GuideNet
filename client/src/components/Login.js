import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import "./Login.css"
import api from "../utils/api"

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
      console.log(res.data)
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

  return (
    <div className="auth-container">
      <h2 className="auth-title">Login</h2>
      <form onSubmit={onSubmit} className="auth-form">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <div className="form-group">
          <input
            type="email"
            id="email"
            placeholder="Email"
            name="email"
            value={email}
            onChange={onChange}
            required
            className="auth-input"
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            id="password"
            placeholder="Password"
            name="password"
            value={password}
            onChange={onChange}
            minLength="6"
            required
            className="auth-input"
          />
        </div>
        <div className="auth-buttons">
          <button type="submit" className="submit-button">
            Login
          </button>
          <Link to="/">
            <button type="button" className="home-button">
              Back to Home
            </button>
          </Link>
        </div>
        <div className="links-container">
          <Link to="/register" className="auth-link">
            Don't have an account? Sign Up
          </Link>
          <Link to="/forgot-password" className="auth-link">
            Forgot Password?
          </Link>
        </div>
      </form>
    </div>
  )
}

export default Login
