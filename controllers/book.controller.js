import Book from "../models/book.model.js";

// add book
export const createBook = async (req, res) => {
  try {
    const { title, author, isbn, category, totalCopies } = req.body;

    if (!title || !author || !isbn) {
      return res.status(400).json({
        success: false,
        message: "Title, author and isbn are required",
      });
    }

    const existing = await Book.findOne({ isbn });
    if (existing) {
      return res.status(400).json({ success: false, message: "A book with this ISBN already exists" });
    }

    const copies = totalCopies || 1;

    const newBook = await Book.create({
      title,
      author,
      isbn,
      category,
      totalCopies: copies,
      availableCopies: copies, // shuru mein sab copies shelf pe available hain
    });

    return res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: newBook,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get all books (title ya author se search)
export const getAllBooks = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";

    // $or: "title MEIN match ho, YA author mein match ho" - dono jagah search
    const filter = search
      ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { author: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const totalBooks = await Book.countDocuments(filter);
    const books = await Book.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: books,
      pagination: { total: totalBooks, page, totalPages: Math.ceil(totalBooks / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get single book
export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: "Book not found" });

    return res.status(200).json({ success: true, data: book });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// update book
export const updateBook = async (req, res) => {
  try {
    const { title, author, category } = req.body;

    const updated = await Book.findByIdAndUpdate(
      req.params.id,
      { title, author, category },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Book not found" });

    return res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Existing book ki quantity BADHANE ke liye - totalCopies aur availableCopies dono ko usi count se increment karta hai
export const addBookCopies = async (req, res) => {
  try {
    const { count } = req.body;
    const numCount = Number(count);

    if (!numCount || numCount < 1 || !Number.isInteger(numCount)) {
      return res.status(400).json({ success: false, message: "count must be a positive whole number" });
    }

    const updated = await Book.findByIdAndUpdate(
      req.params.id,
      { $inc: { totalCopies: numCount, availableCopies: numCount } },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Book not found" });

    return res.status(200).json({
      success: true,
      message: `${numCount} cop${numCount === 1 ? "y" : "ies"} added successfully`,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// delete book
export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: "Book not found" });

    // kisi book ki copies abhi issued hain to delete allow nahi karte, warna BookIssue records ek deleted book ko point karte reh jaate
    if (book.availableCopies < book.totalCopies) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete - some copies of this book are currently issued to students",
      });
    }

    await Book.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, message: "Book deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
