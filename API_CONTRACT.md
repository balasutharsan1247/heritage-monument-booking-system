# API Contract

## Overview

This document defines the API endpoints for the Heritage Monument Booking System.

## Health Check

### GET `/api/health`

Checks if the server is running and healthy.

- **Request:**
  - Method: `GET`
  - URL: `/api/health`

- **Response:**
  - Status Code: `200 OK`
  - Content-Type: `application/json`
  - Body:
    ```json
    {
      "status": "ok",
      "message": "Server is healthy"
    }
    ```

## Error Handling

All API endpoints will return a standardized error response format when an error occurs.

- **Error Response:**
  - Content-Type: `application/json`
  - Body:
    ```json
    {
      "message": "Error description",
      "stack": "Stack trace (development mode only)"
    }
    ```

## Authentication

### POST `/api/auth/register`

Registers a new user (default role is visitor).

- **Request:**
  - Method: `POST`
  - URL: `/api/auth/register`
  - Content-Type: `application/json`
  - Body:
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "secretpassword",
      "role": "visitor"
    }
    ```

- **Response (Success):**
  - Status Code: `201 Created`
  - Body:
    ```json
    {
      "success": true,
      "data": {
        "_id": "60d0fe4f5311236168a109ca",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "visitor",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
    ```

- **Response (Failure - User exists):**
  - Status Code: `400 Bad Request`
  - Body:
    ```json
    {
      "success": false,
      "message": "User already exists"
    }
    ```

### POST `/api/auth/login`

Authenticates a user and returns a JWT token.

- **Request:**
  - Method: `POST`
  - URL: `/api/auth/login`
  - Content-Type: `application/json`
  - Body:
    ```json
    {
      "email": "john@example.com",
      "password": "secretpassword"
    }
    ```

- **Response (Success):**
  - Status Code: `200 OK`
  - Body:
    ```json
    {
      "success": true,
      "data": {
        "_id": "60d0fe4f5311236168a109ca",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "visitor",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
    ```

- **Response (Failure - Invalid credentials):**
  - Status Code: `401 Unauthorized`
  - Body:
    ```json
    {
      "success": false,
      "message": "Invalid credentials"
    }
    ```

### GET `/api/auth/me`

Gets the profile of the currently authenticated user. Requires a valid JWT token.

- **Request:**
  - Method: `GET`
  - URL: `/api/auth/me`
  - Headers:
    - `Authorization`: `Bearer <token>`

- **Response (Success):**
  - Status Code: `200 OK`
  - Body:
    ```json
    {
      "success": true,
      "data": {
        "_id": "60d0fe4f5311236168a109ca",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "visitor",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    }
    ```
