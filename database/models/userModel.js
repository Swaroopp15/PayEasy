const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  passkey : {
    type: String,
    required: true,
    Selection: false,
  },
  balance : {
    type: Number,
    default: 0
  },
})

const userModel = mongoose.model("payment_users", UserSchema);

module.exports =  userModel;