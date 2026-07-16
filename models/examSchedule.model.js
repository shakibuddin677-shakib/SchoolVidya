import mongoose from "mongoose";

// Yeh ek Exam ke andar EK Subject ka paper represent karta hai (jaise "1st Quarterly" exam ke andar "Math ka paper, 6 May, 100 marks")
const examScheduleSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 100,
    },
  },
  { timestamps: true }
);

// Ek Exam ke andar ek Subject ka paper sirf EK baar schedule ho sakta hai
examScheduleSchema.index({ examId: 1, subjectId: 1 }, { unique: true });

const ExamSchedule = mongoose.model("ExamSchedule", examScheduleSchema);
export default ExamSchedule;
