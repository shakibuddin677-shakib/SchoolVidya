import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// Cloudinary ek "stream" chahta hai (data ka continuous flow), lekin multer.memoryStorage() humein sirf ek "buffer" (poori file ek saath) deta hai.
export const uploadToCloudinary = (fileBuffer, folder = "school-management") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder }, // Cloudinary account ke andar konse folder mein save ho
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// Purani image ko Cloudinary se delete karne ke liye
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};
