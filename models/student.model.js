import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    // Yeh field Student ko uske User (login) account se jodta hai
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // ek User sirf EK hi Student profile rakh sakta hai (1-to-1 relationship)
    },
    rollNo: {
      type: String,
      required: true,
      trim: true,
    },
    admissionNo: {
      type: String,
      required: true,
      unique: true, // poore school mein har admission number unique hoga
      trim: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    parentId: {
      // Parent Model abhi nahi bana hai - "Parent Management" chapter mein banayenge
      // tab tak yeh field optional rahega (null ho sakta hai)
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      default: null,
    },
    admissionDate: {
      type: Date,
      default: Date.now, // agar nahi diya, aaj ki date apne aap set ho jayegi
    },
    bloodGroup: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Ek hi class+section mein do students ka rollNo same nahi ho sakta
studentSchema.index({ rollNo: 1, classId: 1, sectionId: 1 }, { unique: true });

const Student = mongoose.model("Student", studentSchema);
export default Student;
