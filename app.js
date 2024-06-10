const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs'); // Import the fs module
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

//the directory for file storage
const uploadDirectory = 'uploads';

// Ensure that the directory for file storage exists
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory);
}

// Multer setup for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirectory + '/'); // Specify the directory where uploaded files will be stored
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Keep the original filename
    }
});
const upload = multer({ storage: storage });

// Create transporter object with SMTP server details
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Route to handle form submission
app.post('/send-email', upload.single('image'), async (req, res) => {
    const { username, to, subject } = req.body;
    const image = req.file; // Get the uploaded image file

    // Split the 'to' field by commas and trim whitespace
    const recipients = to.split(',').map(email => email.trim());

    const mailOptions = {
        from: {
            name: username,
            address: process.env.EMAIL_USER,
        },
        to: recipients,
        subject: subject,
        text: 'Hello world?',
        html: '<b>Hello world?</b>', // edit here for adding the message
        attachments: [{ 
            filename: image.originalname,
            path: path.join(__dirname, uploadDirectory, image.filename),
        }]
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Email has been successfully sent' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Error sending email' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

