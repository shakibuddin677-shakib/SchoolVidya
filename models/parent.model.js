import mongoose from "mongoose";

// Parent yahan LOGIN NAHI karta - isliye ismein password/role nahi hai
// Yeh sirf Student ke saath uske parent ki contact info store karne ke liye hai
const parentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    occupation: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Parent = mongoose.model("Parent", parentSchema);
export default Parent;
