import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// har protected route se pehle chalta hai, token check karke req.user mein user ki details daal deta hai
const isAuthenticated = async (req, res, next) => {
  try {
    // 1) Cookie se (jab browser se request aayi ho) 2) Authorization header se (jab Postman ya mobile app se request aayi ho)
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token found",
      });
    }

    // jwt.verify token decode karta hai aur verify karta hai ki tamper nahi hua, expire/fake token pe error throw karega
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded ke andar { id: userId } hota hai (generateToken.js yaad karo)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found, token invalid",
      });
    }

    // ab is request ke aage jitne bhi controllers/middleware chalenge, sabko pata hoga "kaun request kar raha hai"
    req.user = user;

    next(); // guard bol raha hai "theek hai, andar jao"
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};

export default isAuthenticated;
