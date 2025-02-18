const { render } = require("pug");
const { createUser, getUser } = require("../handlers/userHandlers");
const userModel = require("../database/models/userModel");
const transactionModel = require("../database/models/transactionModel");

const userRouter = require("express").Router();

userRouter.get("/register", (req, res) => {
  res.render("register");
});

userRouter.get("/login", (req, res) => {
  res.render("login");
});

userRouter.get("/init", (req, res) => {
  res.render("init");
});

userRouter.get("/recharge", (req, res) => {
  res.render("recharge");
});

userRouter.post("/register", async (req, res) => {
  try {
    const { fullName, email, passkey } = req.body;
    const user = await createUser(fullName, email, passkey);
    if (!user) {
      res.render("register", { error: "Error at creating user" });
      return res.status(400).json({ message: "Error at user Creation" });
    }
    req.session.userId = user._id;

    res.redirect("/dashboard");
  } catch (error) {
    console.log("Error at user registration route:", error);
    return res.status(400).json({ message: `Error at user Creation: ${error}` });
  }
});

userRouter.post("/login", async (req, res) => {
  try {
    const { email, passkey } = req.body;
    const user = await getUser(email);
    if (!user) {
      res.render("login", { error: "User not found" });
      return res.status(400).json({ message: "User Not Found" });
    }
    if (user.passkey !== passkey) {
      res.render("login", { error: "Invalid Password" });
      return res.status(400).json({ message: "Invalid Password" });
    }
    
    req.session.userId = user._id;
    // console.log(req.session);
    
    res.redirect("/dashboard");
  } catch (error) {
    console.log("Error at user login route:", error);
    return res.status(400).json({ message: `Error at user login: ${error}` });
  }
});


userRouter.get("/dashboard", async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log("User id" + userId);
    
    if (!userId) {
      console.log("No user ID found in session. Redirecting to login.");
      // return res.redirect("/login");
    }

    const user = await userModel.findById(userId);
    if (!user) {
      console.log(`No user found with ID: ${userId}`);
      // return res.status(404).json({ message: "User not found" });
    }

    const transactions = await transactionModel.find({ userId }) || [];

    console.log("User details:", user);
    console.log("Transactions:", transactions);

    res.render("dashboard", { user, transactions });
  } catch (error) {
    console.error("Error at user dashboard route:", error);
    // return res.status(500).json({ message: `Error at user dashboard: ${error.message}` });
  }
});


module.exports = userRouter;
