# COMP 5347 TuT12-G1: Full-Stack Online Shopping System

This project is a full-stack online shopping system developed for COMP 5347, Tutorial 12, Group 1. The frontend is built with React.js, and the backend is powered by Express.js with MongoDB as the database.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation](#installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Database Initialization](#database-initialization)
  - [Admin Access](#admin-access)
    - [Setting up the Admin User](#setting-up-the-admin-user)
    - [Updating Phone List Images](#updating-phone-list-images)
    - [Important Note for Admin and User Sessions](#important-note-for-admin-and-user-sessions)
- [Running the Project](#running-the-project)
  - [Starting the Backend](#starting-the-backend)
  - [Starting the Frontend](#starting-the-frontend)

## Prerequisites

Before you begin, ensure you have the following installed and running on your system:

* **Node.js and npm:** Download and install Node.js (which includes npm) from [https://nodejs.org/en/download/](https://nodejs.org/en/download/). This provides the runtime environment for both frontend and backend development and package management.
* **MongoDB:** Ensure you have a running instance of MongoDB. You can find installation instructions on the [official MongoDB website](https://www.mongodb.com/try/download/community). The MongoDB command-line tools (like `mongoimport`) should also be in your system's PATH if you plan to use them for data import.

## Project Structure

The project is organized into two main directories:

* `frontend/`: Contains all the React.js frontend code.
* `backend/`: Contains all the Express.js backend code.

## Installation

Follow these steps to set up the development environments for both the backend and frontend.

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies (including Express.js and other backend libraries):**
    ```bash
    npm install
    ```

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies (including React, Ant Design, and other frontend libraries):**
    ```bash
    npm install
    ```

## Database Initialization

For the application to function correctly with initial data, you need to populate the `phonelisting` and `userlist` collections in your `TUT12-G1` database.

You will need to have your initial data prepared in JSON format (e.g., `phonelisting.initial.json` and `userlist.initial.json`). These files should contain an array of JSON objects.

You can import this data using MongoDB Compass (via its import feature) or through the command line using `mongoimport`.

**Using `mongoimport` (Linux/macOS command line):**

Ensure your MongoDB server is running. Open your terminal and execute the following commands, replacing `path-to-your/` with the actual path to your data files.

1.  **Import initial phone listing data:**
    ```bash
    mongoimport --uri "mongodb://localhost:27017/TUT12-G1" --collection phonelisting --file path-to-your/phonelisting.json --jsonArray
    ```

2.  **Import initial user list data:**
    ```bash
    mongoimport --uri "mongodb://localhost:27017/TUT12-G1" --collection userlist --file path-to-your/userlist.json --jsonArray
    ```

**Notes on `mongoimport`:**
* The `--uri "mongodb://localhost:27017/TUT12-G1"` flag specifies the connection string to your MongoDB instance and the target database `TUT12-G1`. Adjust this if your MongoDB runs on a different host, port, or requires authentication.
* `--collection` specifies the target collection name.
* `--file` points to the data file.
* `--jsonArray` indicates that the input file is a single JSON array containing multiple documents.

If you don't have these initial data files (`phonelisting.initial.json`, `userlist.initial.json`), you may need to create them based on the project's data schema or obtain them from your group project resources.


### Admin Access

#### Setting up the Admin User

This step involves direct interaction with your MongoDB database. It can be done after the main [Database Initialization](#database-initialization) if your initial user list doesn't include this specific admin.

1.  **Connect to your MongoDB instance** using the `mongo` shell or a MongoDB GUI tool.
2.  **Select your database:**
    ```mongodb
    use TUT12-G1
    ```
3.  **Insert the admin user document into the `administratorlist` collection:**
    ```mongodb
    db.administratorlist.insertOne({
      "email": "admin@example.com",
      "password": "$2b$10$L1.D0PcrQAmgWrWy5asmzO1/T0opqEHQ1BhaZqozYr664Ub7EwnOS",
      "username": "adminUser",
      "token": "abc123def456ghi789",
      "expiryDate": ISODate("2025-12-31T23:59:59.999Z")
    });
    ```
    **Note:** The plain-text password for this admin account is `securepassword123`. The password stored is a hashed version. Ensure the `administratorlist` collection exists or is created by this operation.
    
    You can then login to admin with email: 
    ```
    admin@example.com
    ```
    and password:
    ```
    securepassword123
    ```
    
    **Important Note!!!:** **Please use a different browser(chrome and edge for instance) to each login to user and admin**
#### Updating Phone List Images

This is a database operation to ensure phone images are correctly formatted. Run the following command in your MongoDB shell, ensuring you have selected the correct database (`use TUT12-G1`) and are using the correct collection name (e.g., `phonelisting`).

```mongodb
db.phonelisting.find().forEach(function(doc) {
  if (doc.brand) {
    db.phonelisting.updateOne(
      { _id: doc._id },
      { $set: { image: doc.brand + ".jpeg" } }
    );
  }
});
```
## Running the Project

You need to start both the backend and frontend servers to run the application.

### Starting the Backend

1.  **Navigate to the backend directory (if not already there):**
    ```bash
    cd backend
    ```
2.  **Start the backend server:**
    ```bash
    npm start
    ```
    By default, the backend server will run on port `http://localhost:3000`.

### Starting the Frontend

1.  **Navigate to the frontend directory (if not already there):**
    ```bash
    cd frontend
    ```
2.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    By default, the React development server will run on `http://localhost:5173`.
    To access admin can be accessed through `http://localhost:5173/admin`.
