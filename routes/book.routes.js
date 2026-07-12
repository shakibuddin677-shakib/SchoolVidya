import express from "express";
import {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  addBookCopies,
  deleteBook,
} from "../controllers/book.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", isAuthenticated, allowRoles("admin"), createBook);
router.get("/", isAuthenticated, allowRoles("admin", "teacher", "student"), getAllBooks);
router.get("/:id", isAuthenticated, allowRoles("admin", "teacher", "student"), getBookById);
router.put("/:id", isAuthenticated, allowRoles("admin"), updateBook);
router.patch("/:id/add-copies", isAuthenticated, allowRoles("admin"), addBookCopies);
router.delete("/:id", isAuthenticated, allowRoles("admin"), deleteBook);

export default router;
