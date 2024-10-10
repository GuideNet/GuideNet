import React, { useState } from "react"
import axios from "axios"
import { useParams } from "react-router-dom"
import "./ResetPassword.css"

const ResetPassword = () => {
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const { token } = useParams()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`/api/auth/reset-password/${token}`, {
        password,
      })
      setMessage(res.data.msg)
    } catch (err) {
      setMessage(err.response.data.msg)
    }
  }

  return (
    <div className="reset-password-container">
      <h1 className="reset-password-title">Reset Password</h1>
      <form className="reset-password-form" onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          className="reset-password-input"
        />
        <button type="submit" className="reset-password-button">
          Submit
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  )
}

export default ResetPassword
