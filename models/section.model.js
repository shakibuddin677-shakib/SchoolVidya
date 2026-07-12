import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // jaise "A", "B", "C"
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class", //  yeh line batati hai "yeh ID, Class collection ka document hai"
      required: true,
    },
    classTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // filhal User (role: teacher) - "Teacher Profile Model" chapter mein refine karenge
      default: null,
    },
  },
  { timestamps: true }
);

// Ek hi Class ke andar do section same naam ke nahi ban sakte
// (jaise Grade 5 mein do baar "A" section)
sectionSchema.index({ name: 1, classId: 1 }, { unique: true });

const Section = mongoose.model("Section", sectionSchema);
export default Section;
