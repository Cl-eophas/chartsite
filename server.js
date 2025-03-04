const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(express.json());

// CORS Configuration - More permissive for development
const corsOptions = {
    origin: 'http://localhost:3000', // Explicitly set the frontend origin
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false // Change to false since we're not using cookies yet
};

// Enable CORS with options
app.use(cors(corsOptions));

// Debug middleware - Log all requests
app.use((req, res, next) => {
    console.log('Incoming request:', {
        method: req.method,
        path: req.path,
        headers: req.headers,
        body: req.body
    });
    next();
});

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

// Login route
app.post('/auth/login', async(req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt:', { email, password });

        // For testing, accept any login
        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: { email, name: 'Test User' }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// Register route
app.post('/auth/register', async(req, res) => {
    try {
        console.log('Register request received:', req.body);
        res.status(200).json({
            success: true,
            message: 'Registration successful',
            data: req.body
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: err.message
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('CORS enabled for all origins in development');
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal. Closing server and database connection...');
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('Server and database connections closed.');
            process.exit(0);
        });
    });
});

// Global error handlers
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});