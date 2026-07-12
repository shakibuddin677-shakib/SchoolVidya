import express from "express";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} from "../controllers/subject.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", isAuthenticated, allowRoles("admin"), createSubject);
router.get("/", isAuthenticated, allowRoles("admin", "teacher"), getAllSubjects);
router.get("/:id", isAuthenticated, allowRoles("admin", "teacher"), getSubjectById);
router.put("/:id", isAuthenticated, allowRoles("admin"), updateSubject);
router.delete("/:id", isAuthenticated, allowRoles("admin"), deleteSubject);

export default router;
