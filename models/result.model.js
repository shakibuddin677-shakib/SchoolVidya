import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    examScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSchedule",
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
    },
    grade: {
      type: String, // yeh field controller mein nahi, khud-ba-khud niche wale hook se bharega
    },
  },
  { timestamps: true }
);

// Ek Student ka ek hi paper (ExamSchedule) ke liye sirf EK result ho sakta hai
resultSchema.index({ studentId: 1, examScheduleId: 1 }, { unique: true });

// PRE-SAVE HOOK: yeh document ke DB mein save hone SE THODA PEHLE
// automatically chal jata hai - yahan hum grade calculate kar rahe hain
//
// NOTE: yeh function "async" hai, isliye "next" parameter BILKUL NAHI
// chahiye - Mongoose khud samajh jata hai ki async function complete
// hote hi (ya error throw hote hi) aage kya karna hai
resultSchema.pre("save", async function () {
  // "this" yahan wahi Result document hai jo abhi save ho raha hai
  const ExamSchedule = mongoose.model("ExamSchedule");
  const schedule = await ExamSchedule.findById(this.examScheduleId);

  if (schedule) {
    const percentage = (this.marksObtained / schedule.maxMarks) * 100;

    if (percentage >= 90) this.grade = "A+";
    else if (percentage >= 75) this.grade = "A";
    else if (percentage >= 60) this.grade = "B";
    else if (percentage >= 40) this.grade = "C";
    else this.grade = "F";
  }
  // yahan "next()" nahi likha - function khatam hote hi Mongoose
  // khud aage badh jata hai (async style)
});

const Result = mongoose.model("Result", resultSchema);
export default Result;
