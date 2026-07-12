import crypto from "crypto";

// Ek random temporary password banata hai (jaise "aZ8kP2qLmX")
// crypto.randomBytes use kiya hai - Math.random() se zyada secure/unpredictable
const generateTempPassword = (length = 10) => {
  return crypto
    .randomBytes(length * 2) // thoda zyada bytes lo, safai mein kuch characters chhat jaate hain
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "") // sirf letters/numbers rakho, symbols hata do (URL-safe, aasan type karne layak)
    .slice(0, length);
};

export default generateTempPassword;
