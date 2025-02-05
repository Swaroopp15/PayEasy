const { createUser } = require('../handlers/userHandlers');

const userRouter = require('express').Router();

userRouter.get("/register", (req, res) => {
  res.render("register");
  });

userRouter.get("/init", (req, res) => {
  res.render("init");
});

userRouter.get("/recharge", (req, res) => {
  res.render("recharge");
});

userRouter.post("/register", async (req, res) => {
  try {
    const {fullName, email, passkey} = req.body;
    const user = await createUser(fullName, email, passkey);
    if (!user) {
      return res.status(400).json({ message: "Error at user Creation" });
    }
    req.session.userId = user._id;
    res.render('init', {user})
  } catch (error) {
    console.log("error at user registeration route : ", error);
    return res.status(400).json({ message: `Error at user Creation : ${error}` });
    
  }
})

module.exports = userRouter;