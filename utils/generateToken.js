import jwt from "jsonwebtoken";

// Yeh function ek JWT token banata hai jisme user ki id "hidden" hoti hai Login ke baad yeh token client ko diya jata hai Har request pe client yeh token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" } // 7 din baad token expire ho jayega, phir se login karna hoga
  );
};

export default generateToken;
