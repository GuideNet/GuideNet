const nodemailer = require("nodemailer")
require("dotenv").config()

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        ciphers: "SSLv3",
      },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: text,
    })

    console.log("Email sent successfully")
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

module.exports = sendEmail
