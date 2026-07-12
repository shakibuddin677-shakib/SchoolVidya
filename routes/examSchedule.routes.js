import express from "express";
import {
  createExamSchedule,
  getSchedulesByExam,
  updateExamSchedule,
  deleteExamSchedule,
} from "../controllers/examSchedule.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", isAuthenticated, allowRoles("admin"), createExamSchedule);
router.get(
  "/exam/:examId",
  isAuthenticated,
  allowRoles("admin", "teacher", "student"),
  getSchedulesByExam
);
router.put("/:id", isAuthenticated, allowRoles("admin"), updateExamSchedule);
router.delete("/:id", isAuthenticated, allowRoles("admin"), deleteExamSchedule);

export default router;
