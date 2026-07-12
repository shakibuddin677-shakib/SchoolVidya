import mongoose from "mongoose";

// Yeh humara base "User" model hai - Admin, Teacher, Student
// teeno isi ek collection mein store honge, "role" field se differentiate karenge
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true, // ek email se sirf ek hi account bane
      lowercase: true, // save karte time automatically lowercase ho jayega
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // IMPORTANT: by default password kabhi query mein wapas nahi aayega
    },
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true,
    },
    avatar: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    resetPasswordToken: {
      type: String,
      default: "",
    },
    resetPasswordExpire: {
      type: Date,
    },
  },
  { timestamps: true } // createdAt aur updatedAt automatically add ho jayega
);

const User = mongoose.model("User", userSchema);
export default User;
