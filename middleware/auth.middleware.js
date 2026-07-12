import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Yeh "Reception Guard" hai - har protected route se pehle yeh chalta hai
// Kaam: check karo ki valid token hai ya nahi, aur agar hai to
// req.user mein user ki details daal do taaki aage wale controllers use kar sakein
const isAuthenticated = async (req, res, next) => {
  try {
    // Token do jagah se aa sakta hai:
    // 1) Cookie se (jab browser se request aayi ho)
    // 2) Authorization header se (jab Postman ya mobile app se request aayi ho)
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

    // jwt.verify token ko decode karta hai AUR check karta hai ki
    // yeh humare JWT_SECRET se hi bana tha (tamper toh nahi hua)
    // Agar token expire ho gaya ya fake hai, yeh line error throw karegi
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded ke andar { id: userId } hota hai (generateToken.js yaad karo)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found, token invalid",
      });
    }

    //  Sabse important line: ab is request ke aage jitne bhi
    // controllers/middleware chalenge, sabko pata hoga "kaun request kar raha hai"
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
