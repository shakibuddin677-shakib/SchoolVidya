import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // jaise "Mathematics"
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true, // "math101" bhejo to bhi "MATH101" save hoga - consistency ke liye
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true, // Subject hamesha kisi Class ke curriculum ka hissa hoga
    },
  },
  { timestamps: true }
);

// Ek hi Class ke andar same subject code dobara nahi ban sakta
subjectSchema.index({ code: 1, classId: 1 }, { unique: true });

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;
