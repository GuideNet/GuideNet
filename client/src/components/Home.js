import React from "react"
import { Link } from "react-router-dom"
import "./Home.css" // Import the CSS file
import logo from "../assets/logo.jpg" // Import the image

function Home() {
  return (
    <div className="home-container">
      <img src={logo} alt="Logo" className="home-logo" /> {/* Add the image */}
      <div className="home-buttons">
        <Link to="/register">
          <button className="home-button register-button">Register</button>
        </Link>
        <Link to="/login">
          <button className="home-button login-button">Login</button>
        </Link>
      </div>
    </div>
  )
}

export default Home
