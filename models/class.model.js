import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // jaise "Grade 5" ya "Class X"
    },
    academicYear: {
      type: String,
      required: true,
      trim: true, // jaise "2024-2025"
    },
  },
  { timestamps: true }
);

// COMPOUND INDEX: yeh MongoDB ko bolta hai ki "name + academicYear"
// ka COMBINATION unique hona chahiye - matlab "Grade 5" 2024-2025 mein
// sirf ek hi baar ban sakta hai, lekin "Grade 5" naam se 2025-2026 mein
// dobara ban sakta hai (kyunki academicYear alag hai)
classSchema.index({ name: 1, academicYear: 1 }, { unique: true });

const Class = mongoose.model("Class", classSchema);
export default Class;
