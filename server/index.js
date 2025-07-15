import express from 'express';
import cors from 'cors';

// Initialize app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON bodies

// A sample API route for portfolio data
app.get("/api", (req, res) => {
    // In a real app, you would fetch this from a database
    const dataJson = {
        title: "PALoSA",
        settingTitles: ["Txt & Log", "JSON", "XML"],
    };
    res.json(dataJson);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});