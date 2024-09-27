# GuideNet

This guide will help you set up the project on your local machine.

## Prerequisites

- Node.js (version 14.x or higher)
- npm (comes with Node.js)
- MongoDB Atlas

## Setup Steps

### 1. Clone the Repository

    git clone https://github.com/GuideNet/GuideNet
    cd GuideNet

### 2. Install Dependencies

#### Backend Dependencies

In the project root directory:

    npm install

#### Frontend Dependencies

Navigate to the `client` directory and install dependencies:

    cd client
    npm install

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

    touch .env

Add the following to `.env`:

    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_secure_jwt_secret_key
    PORT=5000

- **Note:** Replace `your_mongodb_connection_string` with your actual MongoDB Atlas connection string.
- Replace `your_secure_jwt_secret_key` with a strong, random string.
- Ensure `.env` is added to your `.gitignore` file.

### 4. Running the Application

Install `concurrently`:

    npm install --save-dev concurrently

Run both servers simultaneously:

    npm run dev
