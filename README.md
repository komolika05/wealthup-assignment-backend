# Scalable File Processing Backend

## Project Overview

This is a backend system built with Node.js and Express designed to handle high-volume file uploads and asynchronous processing. It features a custom-built job queue system using MongoDB to manage state, ensuring resilience and scalability without relying on external queue libraries like Redis/BullMQ.

**Deployed URL:** `http://16.171.136.81:3000/`

## Features

- **AWS S3 Integration:** Direct streaming uploads to S3 using `@aws-sdk/lib-storage` for memory efficiency.
- **Custom Job Queue:** A persistent MongoDB-based queue system handling `PENDING`, `PROCESSING`, `COMPLETED`, and `FAILED` states.
- **Stream Processing:** Uses Node.js Streams and `readline` to process large files line-by-line, ensuring constant memory usage regardless of file size (10MB or 2GB).
- **Batch Insertion:** Optimizes database writes by batching records (1000 at a time).
- **Fault Tolerance:** Automatic error tracking and status updates.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Storage:** AWS S3
- **Deployment:** AWS EC2 (Ubuntu + PM2)

## API Endpoints

### 1. Upload File

**POST** `/upload`

- **Body:** `form-data` with key `file`.
- **Description:** Streams the file directly to S3.
- **Response:**
  ```json
  {
    "message": "File uploaded successfully",
    "fileKey": "171542..."
  }
  ```

### 2. Process File

**POST** `/process/:fileKey`

- **Description:** Enqueues a job to process the file asynchronously. Returns immediately to keep the server responsive.
- **Response:**
  ```json
  {
    "message": "Job created successfully",
    "jobId": "65f...",
    "status": "PENDING"
  }
  ```

### 3. Check Job Status

**GET** `/status/:jobId`

- **Description:** Check the current status of a background job.
- **Response:**
  ```json
  {
    "fileKey": "...",
    "status": "COMPLETED"
  }
  ```

## Setup & Installation

### Local Development

1.  Clone the repo:
    ```bash
    git clone https://github.com/komolika05/wealthup-assignment-backend.git
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create `.env` file:
    ```env
    PORT=3000
    MONGO_URI=mongodb+srv://...
    AWS_REGION=...
    AWS_ACCESS_KEY_ID=...
    AWS_SECRET_ACCESS_KEY=...
    AWS_BUCKET_NAME=...
    ```
4.  Run the server:
    ```bash
    npm run dev
    ```

## Deployment Instructions (AWS EC2)

1.  Provision an EC2 instance (Ubuntu).
2.  SSH into the instance and install Node.js.
3.  Clone the repository and install dependencies.
4.  Set up environment variables in `.env`.
5.  Use **PM2** to keep the application running in the background:
    ```bash
    pm2 start index.js
    ```

## Design Decisions

- **Why Streams?** To handle ambitious file sizes, reading the entire file into memory would cause heap crashes. Streams allow processing infinite data with finite RAM.
- **Why MongoDB for Queues?** Since external libraries were restricted, using MongoDB's atomic operations allows us to lock jobs (`status: PROCESSING`) and ensure fair distribution among workers if we scale horizontally.
