import mongoose from "mongoose";

const homeworkSchema = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Optional - Teacher worksheet/PDF attach kar sakta hai (jaise question paper)
    attachment: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    dueDate: {
      type: Date,
      required: true,
    },
    // Grading ke liye - submission ko kitne marks ke against grade karna hai
    totalMarks: {
      type: Number,
      required: true,
      default: 20,
      min: 1,
      max: 20,
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Homework = mongoose.model("Homework", homeworkSchema);
export default Homework;
