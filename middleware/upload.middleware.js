import multer from "multer";

// memoryStorage() se file disk pe save nahi hoti, seedha RAM mein buffer ke roop mein rehti hai jise turant Cloudinary bhej dete hain
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
