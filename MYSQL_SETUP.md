# Nexus AI: Local MySQL Setup Guide

This guide explains how to connect the Nexus Manufacturing AI frontend to a local MySQL database.

## 1. Prerequisites
*   **MySQL Server:** 8.0+ recommended.
*   **Node.js:** To run the Backend Proxy (Browsers cannot connect to MySQL directly).

## 2. Database Setup
1.  Open your MySQL terminal or Workbench.
2.  Run the contents of `schema.sql`.
3.  **Complete Functionality:** This script now includes all tables for CRM, ERP, Logistics, Quality Control, and the Digital Twin.

## 3. The Backend Proxy (Architecture)
Since this is a client-side React app, you cannot put your MySQL password in the `realDataService.ts` file (it would be visible to anyone). You must use a **Node.js Proxy**.

**Recommended implementation steps:**
1.  Create a folder named `backend`.
2.  `npm init -y` and `npm install express mysql2 cors`.
3.  Create a `server.js` (see code block in previous instructions).
4.  Run it with `node server.js`.

## 4. Why use the Proxy?
*   **Security:** Keeps your DB credentials safe on the server.
*   **CORS:** Handles cross-origin requests between the React app and the DB.
*   **Data Transformation:** Allows you to map complex SQL JOINs into the simple JSON objects the frontend expects.

## 5. Deployment Note
When moving to production (AWS/GCP), the MySQL database should be in a private subnet, and the Proxy server should handle HTTPS and Authentication tokens (JWT).
