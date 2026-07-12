import express from "express";
import {
  issueBook,
  returnBook,
  getIssuesByStudent,
  getAllIssues,
} from "../controllers/bookIssue.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";
import verifyStudentSelf from "../middleware/ownership.middleware.js";

const router = express.Router();

router.post("/issue", isAuthenticated, allowRoles("admin"), issueBook);
router.put("/return/:id", isAuthenticated, allowRoles("admin"), returnBook);
router.get(
  "/student/:studentId",
  isAuthenticated,
  allowRoles("admin", "teacher", "student"),
  verifyStudentSelf,
  getIssuesByStudent
);
router.get("/", isAuthenticated, allowRoles("admin"), getAllIssues);

export default router;
