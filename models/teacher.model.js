import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // ek User sirf EK hi Teacher profile rakh sakta hai
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    // Ek Teacher multiple Subjects padha sakta hai - isliye array of ObjectIds Subject Model abhi nahi bana - us chapter mein ise use karenge
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Teacher = mongoose.model("Teacher", teacherSchema);
export default Teacher;
