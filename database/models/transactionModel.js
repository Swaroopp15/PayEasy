const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  amount: {
    type: Number,
    required: true
  },
  userId : {
    type: Schema.Types.ObjectId,
    ref: 'transaction_users',
  },
  reciptentEmail : {
    type: String,
    required: true
  },
  transactionStatus: {
    type: String,
    enum: ['pending' ,'paid', 'cancelled', 'failed'],
    default: 'pending'
  },
  callbackUrl : {
    type: String,
    required: true
  },
  otp: {
    type: Object
  },
  message : {
    type: String
  }
})

const transactionModel = mongoose.model("payment_transactions",transactionSchema);

module.exports = transactionModel;