const userModel = require("../database/models/userModel");

const createUser = async (fullName, email, passkey) => {
  try {
    const user = await userModel.create({fullName, email, passkey});
    return user;
  } catch (error) {
    console.log("Error raised at user creation : ", error);
  }
}

module.exports = {createUser}