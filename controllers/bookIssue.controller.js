import Book from "../models/book.model.js";
import BookIssue from "../models/bookIssue.model.js";

const FINE_PER_DAY = 5; // ₹5 per din late return pe

// issue book
export const issueBook = async (req, res) => {
  try {
    const { bookId, studentId } = req.body;

    if (!bookId || !studentId) {
      return res.status(400).json({ success: false, message: "bookId and studentId are required" });
    }

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ success: false, message: "Book not found" });

    if (book.availableCopies <= 0) {
      return res.status(400).json({ success: false, message: "No copies available right now" });
    }

    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 din ki default issue period

    const newIssue = await BookIssue.create({ bookId, studentId, issueDate, dueDate });

    // Book issue hote hi uski available copies EK se kam kar do
    book.availableCopies -= 1;
    await book.save();

    return res.status(201).json({
      success: true,
      message: "Book issued successfully",
      data: newIssue,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// return book
export const returnBook = async (req, res) => {
  try {
    const issue = await BookIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: "Issue record not found" });

    if (issue.status === "returned") {
      return res.status(400).json({ success: false, message: "This book is already returned" });
    }

    const returnDate = new Date();

    // Fine calculate karo agar dueDate se late hua
    let fineAmount = 0;
    if (returnDate > issue.dueDate) {
      // milliseconds ka farak / (1000 * 60 * 60 * 24) = kitne din late
      const lateDays = Math.ceil((returnDate - issue.dueDate) / (1000 * 60 * 60 * 24));
      fineAmount = lateDays * FINE_PER_DAY;
    }

    issue.returnDate = returnDate;
    issue.status = "returned";
    issue.fineAmount = fineAmount;
    await issue.save();

    // Book wapas aayi, uski available copies EK se badha do
    const book = await Book.findById(issue.bookId);
    if (book) {
      book.availableCopies += 1;
      await book.save();
    }

    return res.status(200).json({
      success: true,
      message: "Book returned successfully",
      data: issue,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get issues by student
export const getIssuesByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const issues = await BookIssue.find({ studentId }).populate("bookId", "title author");

    return res.status(200).json({ success: true, data: issues });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get all issues (admin view, status se filter)
export const getAllIssues = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    // student ka naam User document se aata hai, isliye nested populate zaroori hai warna sirf rollNo milta tha
    const issues = await BookIssue.find(filter)
      .populate("bookId", "title author")
      .populate({
        path: "studentId",
        select: "rollNo classId sectionId userId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "classId", select: "name" },
          { path: "sectionId", select: "name" },
        ],
      })
      .sort({ issueDate: -1 });

    return res.status(200).json({ success: true, data: issues });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
