import mongoose from "mongoose";

// Yeh function MongoDB se connection banata hai
// async isliye kyunki DB connect hone mein time lagta hai
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log(" MongoDB Connected");
  } catch (error) {
    console.log(" Error connecting to DB:", error.message);
    process.exit(1); // agar DB connect nahi hua to server band kar do
  }
};

export default connectDB;
