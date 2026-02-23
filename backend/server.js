// Importing required modules
import express from 'express';
import "dotenv/config";

const app = express();
const PORT = process.env.PORT;

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Media Management System!');
});

// Starting the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
