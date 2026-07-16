import { v2 as cloudinary } from "cloudinary";

// Yeh Cloudinary ko humari secret keys (.env se) ke saath "connect" karta hai Iske baad poore project mein jahan bhi "cloudinary" import karenge, yeh already
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
