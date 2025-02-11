const transactionModel = require("../database/models/transactionModel");

const createTransaction = async (amount, reciptentEmail, callbackUrl) => {
  try{
    const transaction = await transactionModel.create({
      amount: amount,
      reciptentEmail: reciptentEmail,
      callbackUrl
    })
    return transaction;
  }catch(error) {
    console.log("Error at initializing/creating transaction : ", error);
  }
}


module.exports = {createTransaction};