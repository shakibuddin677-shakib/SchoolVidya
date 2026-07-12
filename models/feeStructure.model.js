import mongoose from "mongoose";

// Yeh "price list" hai - kisi specific student ka nahi, poori Class ke liye
const feeStructureSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    // FEATURE: "Tuition Fee" ab MONTH-WISE track hota hai, baaki fee types
    // (Exam Fee, Library Fee, etc.) TERM-WISE hi rehte hain jaise pehle the.
    // billingType decide karta hai konsa field (term ya month) use hoga.
    billingType: {
      type: String,
      enum: ["term", "month"],
      default: "term",
    },
    term: {
      type: String,
      trim: true, // jaise "Term 1" - billingType "term" hone par required
      default: "",
    },
    // Format: "YYYY-MM" (jaise "2026-07") - billingType "month" hone par required
    month: {
      type: String,
      trim: true,
      default: "",
    },
    feeType: {
      type: String,
      required: true,
      trim: true, // jaise "Tuition Fee", "Exam Fee", "Library Fee"
    },
    amount: {
      type: Number,
      required: true,
    },
    // Fees Reminder widget (Student Dashboard) ke liye - "Last Date" dikhane ko.
    // Optional rakha hai taaki purani fee structures (jinme date set nahi hai)
    // break na ho
    dueDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Ek Class ke liye ek Term/Month mein ek feeType sirf EK baar define ho.
// "term" aur "month" dono hamesha string hain (default "") isliye yeh
// compound unique index safely kaam karta hai (kabhi undefined/null nahi hota)
feeStructureSchema.index({ classId: 1, feeType: 1, term: 1, month: 1 }, { unique: true });

const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);
export default FeeStructure;
