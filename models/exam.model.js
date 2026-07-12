import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // jaise "1st Quarterly Exam"
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    term: {
      type: String,
      required: true,
      trim: true, // jaise "Term 1"
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    // Jab tak Admin explicitly "Release Results" na kare, Students ko
    // is exam ke marks bilkul nahi dikhenge (chahe Teacher ne sab
    // subjects ke marks kabhi ke enter kar diye ho) - Admin/Teacher
    // hamesha dekh sakte hain, sirf Student role ke liye yeh gate hai
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Exam = mongoose.model("Exam", examSchema);
export default Exam;
