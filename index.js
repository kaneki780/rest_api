const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer'); // For handling file uploads
const mime = require('mime-types'); // For detecting file type

const app = express();
const PORT = 8000;

// Middleware to parse JSON
app.use(express.json());
app.use(bodyParser.json());

// Multer setup for file upload handling (form-data)
const upload = multer();

// Simulated user details
const userDetails = {
    full_name: "chetan_punyani",
    dob: "24062003", // ddmmyyyy format
    email: "cb1100@srmist.edu.in",
    roll_number: "RA211030030021"
};

// Function to calculate file size in KB for Base64 strings
function calculateFileSize(base64String) {
    const stringLength = base64String.length;
    const fileSizeBytes = Math.ceil((stringLength * 3) / 4); // Base64 is 1.33x larger than binary
    return fileSizeBytes / 1024; // Convert bytes to kilobytes
}

// Helper function to separate numbers and alphabets
function separateData(data) {
    const numbers = data.filter(item => !isNaN(item)); // Extract numbers
    const alphabets = data.filter(item => isNaN(item)); // Extract alphabets
    const lowercaseAlphabets = alphabets.filter(item => item.match(/[a-z]/));
    const highestLowercaseAlphabet = lowercaseAlphabets.length > 0 ? lowercaseAlphabets.sort().pop() : null;

    return {
        numbers,
        alphabets,
        highestLowercaseAlphabet
    };
}

// Helper function to validate and extract information from base64-encoded files
function isValidBase64(base64String) {
    try {
        const binaryData = Buffer.from(base64String, 'base64');
        const mimeType = mime.lookup('file.pdf'); // Simulated MIME type detection
        const sizeInKB = binaryData.length / 1024;

        return {
            valid: true,
            mimeType: mimeType || 'application/octet-stream',
            sizeInKB
        };
    } catch (error) {
        return { valid: false, mimeType: null, sizeInKB: null };
    }
}

// POST route to handle requests with file upload and base64 string
app.post('/bfhl', upload.single('file'), (req, res) => {
    let { data, file_b64 } = req.body;

    // If data is sent via form-data, it will come as a string, so parse it
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (error) {
            return res.status(400).json({ is_success: false, message: "Invalid data format" });
        }
    }

    // Check if data exists and is an array
    if (!Array.isArray(data)) {
        return res.status(400).json({ is_success: false, error: "Invalid or missing 'data' field" });
    }

    // Separate numbers and alphabets
    const { numbers, alphabets, highestLowercaseAlphabet } = separateData(data);

    // Handle file validation from Base64 (for file_b64 field in JSON)
    let fileResponse = {
        file_valid: false,
        file_mime_type: null,
        file_size_kb: null,
    };

    if (file_b64) {
        const { valid, mimeType, sizeInKB } = isValidBase64(file_b64);
        if (valid) {
            fileResponse.file_valid = true;
            fileResponse.file_mime_type = mimeType;
            fileResponse.file_size_kb = sizeInKB.toFixed(2);
        }
    } else if (req.file) { // Handle file validation from form-data (actual file upload)
        fileResponse.file_valid = true;
        fileResponse.file_mime_type = req.file.mimetype;
        fileResponse.file_size_kb = (req.file.size / 1024).toFixed(2);
    }

    // Final response object
    const response = {
        is_success: true,
        user_id: `${userDetails.full_name}_${userDetails.dob}`,
        email: userDetails.email,
        roll_number: userDetails.roll_number,
        numbers,
        alphabets,
        highest_lowercase_alphabet: highestLowercaseAlphabet ? [highestLowercaseAlphabet] : [],
        ...fileResponse,
    };

    res.json(response);
});

// GET route to handle requests
app.get('/bfhl', (req, res) => {

    const response = {
        operation_code: "1"
    };

    res.status(200).json(response);
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));
