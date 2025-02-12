const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const nodemailer = require('nodemailer');
const connectDb = require('./database/mongodb');
const userModel = require('./database/models/userModel');
const transactionModel = require('./database/models/transactionModel');
const transactionRouter = require('./controllers/transaction');
const { default: mongoose } = require('mongoose');
const userRouter = require('./controllers/user');

const app = express();
const PORT = 5000;


let otpStorage = {}; // { email: { otp, expiresAt }}

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'rebook635@gmail.com',  
        pass: 'jeglhgasdjpmwlwf'    
    }
});

// Middleware   
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use(session({ secret: 'securekey', resave: false, saveUninitialized: true }));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to Protect Routes After User Validation
// function isAuthenticated(req, res, next) {
//     if (!req.session.email) {
//         return res.redirect('/');
//     }
//     next();
// }

// Home Page (Payment Page)
app.get('/', async (req, res) => {    
    res.render('index', { error: null });
});

app.get('/dashboard', async (req, res) => {    
    res.render('dashboard', { error: null });
});

// Validate User
app.post('/validate-user', async (req, res) => {
    try {
        const { email, transaction_id } = req.body;
        
        // if (!transaction_id || transaction_id.trim() === '') {
        //     return res.render('payment', { error: 'Invalid transaction ID!' });
        // }
        
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.render('payment', { error: 'User not found!' });
        }

        await transactionModel.updateOne(
            { _id: transaction_id }, 
            { $set: { userId: user._id } }
        );

        req.session.email = email; // Store email in session
        res.render('auth-options', { email, transaction_id, error: null });
        
    } catch (error) {
        console.log("Error at user validation : ", error);
        res.render('payment', { error: 'Something went wrong!' });
    }
});

// Authentication (OTP or PIN)
app.post('/authenticate', async (req, res) => {
    try {
        
        const { method, email, transaction_id } = req.body;
        const transaction = await transactionModel.findById(transaction_id);
        
        const user = await userModel.findById(transaction.userId);
        
        if (!user) {
            return res.render('payment', { error: 'User not found!' });
        }
        
        req.session.method = method; // Store authentication method
        
        if (method === 'pin') {
            // Redirect to PIN authentication page
            res.render('auth', { transaction_id, method, placeholder: 'Enter PIN', error: null });
        } else if (method === 'otp') {
            // Generate and send OTP
            const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
            const otpObject = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // Expires in 5 minutes
            await transactionModel.updateOne({_id: transaction_id}, { $set: {otp : otpObject} });
            
            // Send OTP via email
            const mailOptions = {
                from: 'rebook635@gmail.com', // Fix sender email
                to: user.email,
                subject: 'Your OTP Code',
                text: `Your OTP code is: ${otp}`
            };
            
            try {
                await transporter.sendMail(mailOptions);
                // Redirect to OTP verification page
                res.render('otp', { transaction_id, error: null });
            } catch (error) {
                console.error('Error sending OTP:', error);
                res.render('auth-options', { transaction_id, error: 'Failed to send OTP. Try again later.' });
            }
        }
    } catch (error) {
        console.log("Error at authentication : ", error);
    }
});


// Verify OTP or PIN
app.post('/verify-auth',  async (req, res) => {
    try {
        
        const { authInput, transaction_id } = req.body;
        const email = req.session.email;
        const method = req.session.method;
        const transaction = await transactionModel.findById(transaction_id);
        
        const user = await userModel.findById(transaction.userId);
        
        if (!user) {
            return res.render('payment', { error: 'User not found!' });
        }
        
        if (method === 'pin') {
            if (user.passkey !== authInput) {
                return res.render('auth', { email, method, placeholder: 'Enter PIN', error: 'Invalid PIN!' });
            }
        } else if (method === 'otp') {
            const otpData = transaction.otp;
            
            if (!otpData || otpData.otp.toString() !== authInput || Date.now() > otpData.expiresAt) {
                return res.render('auth-options', { email, method, placeholder: 'Enter OTP', error: 'Invalid or expired OTP!' });
            }
            delete otpStorage[email]; // Remove OTP after successful verification
        }
        
        req.session.verified = true; // Mark as verified
        
        res.render('amount', { email, balance: user.balance, error: null });
    } catch (error) {
        console.log("Error at verify-auth : ", error);
    }
});

// Process Payment
app.post('/process-payment', async (req, res) => {
    if (!req.session.verified) {
        return res.render('payment', { error: 'Unauthorized access!' });
    }

    const { amount } = req.body;
    const email = req.session.email;
    const user = await userModel.findOne({email});
    const amountNum = parseInt(amount);
    
    if (!user) {
        return res.render('payment', { error: 'User not found!' });
    }
    
    if (user.balance < amountNum) {
        return res.render('amount', { email, balance: user.balance, error: 'Insufficient balance!' });
    }
    
    user.balance -= amountNum;
    await user.save();
    const transactionId = `TXN${Date.now()}`;

    req.session.destroy(); // Clear session after payment

    res.render('success', { transactionId, amount });
});

app.use(transactionRouter);
app.use(userRouter);


// Start Server
connectDb()
  .then(() => {
    console.log("Mongo db connected");
  })
  .then(
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    })
  );

