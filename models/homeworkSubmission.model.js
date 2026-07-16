import mongoose from "mongoose";

const homeworkSubmissionSchema = new mongoose.Schema(
  {
    homeworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Homework",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    // Student ke liye attachment COMPULSORY hai - answer file/photo ke bina submission ka koi matlab nahi
    attachment: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["submitted", "late", "graded"],
      default: "submitted",
    },
    marksAwarded: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Ek Student ek Homework ko sirf EK baar submit kar sakta hai
homeworkSubmissionSchema.index({ homeworkId: 1, studentId: 1 }, { unique: true });

const HomeworkSubmission = mongoose.model("HomeworkSubmission", homeworkSubmissionSchema);
export default HomeworkSubmission;
