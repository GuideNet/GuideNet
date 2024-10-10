import React, { useState } from "react"
import axios from "axios"
import "./ForgotPassword.css"

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post("/api/auth/forgot-password", { email })
      setMessage(res.data.msg)
    } catch (err) {
      setMessage(err.response.data.msg || "Error sending email")
    }
  }

  return (
    <div className="forgot-password-container">
      <h1 className="forgot-password-title">Forgot Password</h1>
      <form className="forgot-password-form" onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="forgot-password-input"
        />
        <button type="submit" className="forgot-password-button">
          Submit
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  )
}

export default ForgotPassword
