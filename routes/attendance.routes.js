import express from "express";
import {
  markAttendance,
  getAttendanceBySection,
  getAttendanceByStudent,
  updateAttendance,
} from "../controllers/attendance.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";
import verifyStudentSelf from "../middleware/ownership.middleware.js";

const router = express.Router();

// Admin aur Teacher dono attendance mark kar sakte hain
router.post("/mark", isAuthenticated, allowRoles("admin", "teacher"), markAttendance);

router.get("/section", isAuthenticated, allowRoles("admin", "teacher"), getAttendanceBySection);

// Student apna khud ka attendance dekh sakta hai, Admin/Teacher kisi ka bhi
router.get(
  "/student/:studentId",
  isAuthenticated,
  allowRoles("admin", "teacher", "student"),
  verifyStudentSelf,
  getAttendanceByStudent
);

router.put("/:id", isAuthenticated, allowRoles("admin", "teacher"), updateAttendance);

export default router;
