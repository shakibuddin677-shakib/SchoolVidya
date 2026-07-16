import express from "express";
import {
  createHomework,
  getHomeworkBySection,
  getHomeworkById,
  updateHomework,
  deleteHomework,
} from "../controllers/homework.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// upload.single("attachment") - agar file bheji, req.file bharega; agar nahi bheji, req.file undefined rahega (controller khud handle karta hai)
router.post(
  "/",
  isAuthenticated,
  allowRoles("admin", "teacher"),
  upload.single("attachment"),
  createHomework
);

router.get(
  "/section/:sectionId",
  isAuthenticated,
  allowRoles("admin", "teacher", "student"),
  getHomeworkBySection
);
router.get(
  "/:id",
  isAuthenticated,
  allowRoles("admin", "teacher", "student"),
  getHomeworkById
);
router.put("/:id", isAuthenticated, allowRoles("admin", "teacher"), updateHomework);
router.delete("/:id", isAuthenticated, allowRoles("admin", "teacher"), deleteHomework);

export default router;
