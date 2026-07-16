import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      required: true,
      unique: true, // har book ka ISBN duniya mein unique hota hai
      trim: true,
    },
    category: {
      type: String,
      trim: true, // jaise "Fiction", "Science"
    },
    totalCopies: {
      type: Number,
      required: true,
      default: 1,
    },
    // Yeh field har issue/return ke saath UPDATE hoga - "kitni copies ABHI shelf pe available hain" (totalCopies fix rehta hai)
    availableCopies: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { timestamps: true }
);

const Book = mongoose.model("Book", bookSchema);
export default Book;
