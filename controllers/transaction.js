const { default: mongoose } = require("mongoose");
const transactionModel = require("../database/models/transactionModel");
const userModel = require("../database/models/userModel");
const { createTransaction } = require("../handlers/transactions");

const transactionRouter = require("express").Router();

transactionRouter.post("/init", async (req, res) => {
  const { reciptentEmail, amount, callbackUrl } = req.body;
  
  try {
    const callbackUrls = callbackUrl || "http://localhost:5000/init"
    const transaction = await createTransaction(amount, reciptentEmail, callbackUrls);
    const transactionLink = `http://localhost:5000/payment/id=${transaction._id}`;

    // here we are checking if the request comes from a browser (Html form submission) as the browser reads (accepts) only Html
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.redirect(transactionLink);
    }

    // If not a browser request, send JSON response (for API clients / websites using our api like rebook)
    return res.status(200).json({ transactionLink, transaction });

  } catch (error) {
    console.log("Error at initaing payment route: ", error);
    
    return res.status(400).json({ message: `Error occurred at transaction initializing: ${error}` });
  }
});


transactionRouter.get("/payment/id=:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const transaction = await transactionModel.findById(id);
    res.render('payment', {transaction_id : id});
  } catch (error) {
    res.status(400).send("Error occured at transaction retrieving : ", error);
  }
});

transactionRouter.post('/credit', async (req, res) => {
  const { transaction_id } = req.body;
  
  try {
    const id = new mongoose.Types.ObjectId(transaction_id);
    const transaction = await transactionModel.findOne({_id:id});
    
    transaction.transactionStatus = 'success';
    await transaction.save(); 

    const recipient = await userModel.findOne({email: transaction.reciptentEmail});
    recipient.balance = recipient.balance + transaction.amount;
    await recipient.save();

     if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.redirect(transaction.callbackUrl);
    }
   
    res.status(200).json({ message: 'Credited to recipient successfully' });

  } catch (error) {
    console.error("Error at crediting recipient:", error);
    res.status(400).json({ message: "Error occurred while crediting recipient", error: error.message });
  }
});


module.exports = transactionRouter;