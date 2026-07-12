import express from "express";
import {
  submitHomework,
  gradeSubmission,
  getSubmissionsByHomework,
  getSubmissionsByStudent,
} from "../controllers/homeworkSubmission.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";
import verifyStudentSelf from "../middleware/ownership.middleware.js";

const router = express.Router();

router.post(
  "/submit",
  isAuthenticated,
  allowRoles("student"),
  upload.single("attachment"),
  submitHomework
);

router.put("/grade/:id", isAuthenticated, allowRoles("admin", "teacher"), gradeSubmission);

router.get(
  "/homework/:homeworkId",
  isAuthenticated,
  allowRoles("admin", "teacher"),
  getSubmissionsByHomework
);
router.get(
  "/student/:studentId",
  isAuthenticated,
  allowRoles("admin", "teacher", "student"),
  verifyStudentSelf,
  getSubmissionsByStudent
);

export default router;
