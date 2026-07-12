import express from "express";
import {
  getDashboardStats,
  getAttendanceReport,
  getFeeCollectionReport,
  getExamPerformanceReport,
  getStudentProgress,
  getBestTeachers,
} from "../controllers/report.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/dashboard-stats", isAuthenticated, allowRoles("admin"), getDashboardStats);
router.get("/attendance", isAuthenticated, allowRoles("admin"), getAttendanceReport);
router.get("/fee-collection", isAuthenticated, allowRoles("admin"), getFeeCollectionReport);
router.get(
  "/exam-performance",
  isAuthenticated,
  allowRoles("admin", "teacher"),
  getExamPerformanceReport
);
router.get(
  "/student-progress",
  isAuthenticated,
  allowRoles("admin", "teacher"),
  getStudentProgress
);
router.get("/best-teachers", isAuthenticated, allowRoles("admin"), getBestTeachers);

export default router;
