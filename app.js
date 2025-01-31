const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 5000;

// Dummy Bank Data
const bankUsers = [
    { email: 'swaroop@yopmail.com', pin: '1234', balance: 1000 },
    { email: 'jayanth@yopmail.com', pin: '5678', balance: 800 },
    { email: 'vamsi@yopmail.com', pin: '4321', balance: 500 }
];

let otpStorage = {};

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'swarooppalacharla09@gmail.com',  
        pass: 'Swaroop@15'    
    }
});

// Middleware   
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'securekey', resave: false, saveUninitialized: true }));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Payment Page
app.get('/', (req, res) => {
    res.render('payment', { error: null });
});

// Validate User
app.post('/validate-user', (req, res) => {
    const { email } = req.body;
    const user = bankUsers.find(u => u.email === email);
    
    if (!user) {
        return res.render('payment', { error: 'User not found!' });
    }
    req.session.email = email;
    res.render('auth', { email, error: null });
});

// Authentication (OTP or PIN)
app.post('/authenticate', async (req, res) => {
    const { method } = req.body;
    const email = req.session.email;
    const user = bankUsers.find(u => u.email === email);
    
    if (!user) {
        return res.render('payment', { error: 'User not found!' });
    }
    
    if (method === 'pin') {
        res.render('auth', { email, method, placeholder: 'Enter PIN', error: null });
    } else if (method === 'otp') {
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
        otpStorage[email] = otp;

        // Send OTP via email
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is: ${otp}`
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`OTP sent to ${email}`);
            res.render('auth', { email, method, placeholder: 'Enter OTP', error: null });
        } catch (error) {
            console.error('Error sending OTP:', error);
            res.render('auth', { email, error: 'Failed to send OTP. Try again later.' });
        }
    }
});

// Verify OTP or PIN
app.post('/verify-auth', (req, res) => {
    const { method, authInput } = req.body;
    const email = req.session.email;
    const user = bankUsers.find(u => u.email === email);
    
    if (!user) {
        return res.render('payment', { error: 'User not found!' });
    }
    
    if (method === 'pin') {
        if (user.pin !== authInput) {
            return res.render('auth', { email, method, placeholder: 'Enter PIN', error: 'Invalid PIN!' });
        }
    } else if (method === 'otp') {
        if (!otpStorage[email] || otpStorage[email].toString() !== authInput) {
            return res.render('auth', { email, method, placeholder: 'Enter OTP', error: 'Invalid OTP!' });
        }
        delete otpStorage[email];
    }
    
    res.render('amount', { email, error: null });
});

// Process Payment
app.post('/process-payment', (req, res) => {
    const { amount } = req.body;
    const email = req.session.email;
    const user = bankUsers.find(u => u.email === email);
    const amountNum = parseInt(amount);
    
    if (!user) {
        return res.render('payment', { error: 'User not found!' });
    }
    
    if (user.balance < amountNum) {
        return res.render('amount', { email, error: 'Insufficient balance!' });
    }
    
    user.balance -= amountNum;
    const transactionId = `TXN${Date.now()}`;

    res.render('success', { transactionId, amount });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
