import multer from "multer";

// memoryStorage() ka matlab hai file server ke disk pe save NAHI hogi -
// seedha RAM mein ek "buffer" (raw bytes) ke roop mein rahegi, jise
// hum turant Cloudinary ko bhej denge. Isse temp files clean karne
// ki zaroorat nahi padti
const storage = multer.memoryStorage();

// Sirf image files allow karo - koi bhi PDF/EXE waghera upload na ho sake
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // file accept karo
  } else {
    cb(new Error("Only image files are allowed"), false); // reject karo
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB se badi file allow nahi
  },
});

export default upload;
