import React, { useState } from "react"
import axios from "axios"
import { useParams } from "react-router-dom"

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
    <div>
      <h1>Reset Password</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
        />
        <button type="submit">Submit</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}

export default ResetPassword
