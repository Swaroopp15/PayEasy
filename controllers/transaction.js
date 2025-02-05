const transactionModel = require("../database/models/transactionModel");
const { createTransaction } = require("../handlers/transactions");

const transactionRouter = require("express").Router();

transactionRouter.post("/init", async (req, res) => {
  const { reciptentEmail, amount } = req.body;
  try {
    console.log(reciptentEmail);
    
    const transaction = await createTransaction(amount, reciptentEmail);
    console.log(transaction);
    
    res.status(200).send({
      transactionLink: `http://localhost:5000/payment/id=${transaction._id}`,
      transaction,
    });
  } catch (error) {
    res.status(400).send({message : `Error occured at transaction initializing : ${error}`});
  }
});

transactionRouter.get("/payments/id=:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);
  
  try {
    // const transaction = await transactionModel.findById(id);
    res.render('payment', {transaction_id : id});
  } catch (error) {
    res.status(400).send("Error occured at transaction retrieving : ", error);
  }
});

module.exports = transactionRouter;