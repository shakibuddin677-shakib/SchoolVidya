import express from "express";
import {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  getExamResultStatus,
  releaseExamResults,
  unpublishExamResults,
} from "../controllers/exam.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", isAuthenticated, allowRoles("admin"), createExam);
router.get("/", isAuthenticated, allowRoles("admin", "teacher", "student"), getAllExams);
router.get("/:id", isAuthenticated, allowRoles("admin", "teacher", "student"), getExamById);
router.get("/:id/result-status", isAuthenticated, allowRoles("admin", "teacher"), getExamResultStatus);
router.put("/:id/release-results", isAuthenticated, allowRoles("admin"), releaseExamResults);
router.put("/:id/unpublish-results", isAuthenticated, allowRoles("admin"), unpublishExamResults);
router.put("/:id", isAuthenticated, allowRoles("admin"), updateExam);
router.delete("/:id", isAuthenticated, allowRoles("admin"), deleteExam);

export default router;
