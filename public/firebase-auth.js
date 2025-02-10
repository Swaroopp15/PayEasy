// firebase-auth.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCHKIHxHH98lQHksQOhHZxRdYE1bEnnXzg",
    authDomain: "fir-97873.firebaseapp.com",
    projectId: "fir-97873",
    storageBucket: "fir-97873.firebasestorage.app",
    messagingSenderId: "218722498646",
    appId: "1:218722498646:web:1f2d26c81098de553823f7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to Send OTP
window.sendOTP = function () {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
            console.log('reCAPTCHA solved');
        }
    }, auth);

    signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
        .then((confirmationResult) => {
            window.confirmationResult = confirmationResult;
            alert('OTP sent successfully!');
        })
        .catch((error) => {
            console.error('Error sending OTP:', error);
            alert('Failed to send OTP. Please try again.');
        });
};

// Function to Verify OTP
window.verifyOTP = function () {
    const otp = document.getElementById('otp').value;
    confirmationResult.confirm(otp)
        .then((result) => {
            alert('Phone number verified successfully!');
            window.location.href = '/success'; // Redirect to success page
        })
        .catch((error) => {
            console.error('Error verifying OTP:', error);
            alert('Invalid OTP. Please try again.');
        });
};