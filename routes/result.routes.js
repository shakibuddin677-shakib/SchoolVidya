import express from "express";
import {
  enterResults,
  getResultsBySchedule,
  getResultsByStudent,
  getClassRanking,
} from "../controllers/result.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";
import verifyStudentSelf from "../middleware/ownership.middleware.js";

const router = express.Router();

router.post("/enter", isAuthenticated, allowRoles("admin", "teacher"), enterResults);
router.get(
  "/schedule/:examScheduleId",
  isAuthenticated,
  allowRoles("admin", "teacher"),
  getResultsBySchedule
);
router.get(
  "/student/:studentId",
  isAuthenticated,
  allowRoles("admin", "teacher", "student"),
  verifyStudentSelf,
  getResultsByStudent
);
router.get(
  "/ranking/:examId",
  isAuthenticated,
  allowRoles("admin", "teacher", "student"),
  getClassRanking
);

export default router;
