import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Teacher role wala User
      required: true,
    },
    startTime: {
      type: String,
      required: true, // jaise "09:00"
    },
    endTime: {
      type: String,
      required: true, // jaise "09:45"
    },
  },
  { timestamps: true }
);

// Ek Section ke ek din mein, ek hi time slot pe do periods nahi ho sakte
timetableSchema.index({ sectionId: 1, dayOfWeek: 1, startTime: 1 }, { unique: true });

const Timetable = mongoose.model("Timetable", timetableSchema);
export default Timetable;
