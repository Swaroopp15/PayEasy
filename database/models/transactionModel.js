const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  transactionAmount: {
    type: Number,
    required: true
  },
  userId : {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reciptentId : {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transactionStatus: {
    type: String,
    enum: ['pending' ,'paid', 'cancelled', 'failed'],
    default: 'pending'
  },
  message : {
    type: String
  }
})

const transactionModel = mongoose.model("payment_transactions",transactionSchema);

module.exports = transactionModel;