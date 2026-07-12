import mongoose from "mongoose";

// Yeh ASLI transaction hai - kisne, kaunsi book, kab li, kab wapas karni hai
const bookIssueSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      default: null, // jab tak wapas na ho, yeh khaali rahega
    },
    status: {
      type: String,
      enum: ["issued", "returned"],
      default: "issued",
    },
    fineAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const BookIssue = mongoose.model("BookIssue", bookIssueSchema);
export default BookIssue;
