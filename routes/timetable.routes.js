import express from "express";
import {
  createPeriod,
  getTimetableBySection,
  getTimetableByTeacher,
  updatePeriod,
  deletePeriod,
} from "../controllers/timetable.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", isAuthenticated, allowRoles("admin"), createPeriod);
router.get(
  "/section/:sectionId",
  isAuthenticated,
  allowRoles("admin", "teacher", "student"),
  getTimetableBySection
);
router.get(
  "/teacher/:teacherId",
  isAuthenticated,
  allowRoles("admin", "teacher"),
  getTimetableByTeacher
);
router.put("/:id", isAuthenticated, allowRoles("admin"), updatePeriod);
router.delete("/:id", isAuthenticated, allowRoles("admin"), deletePeriod);

export default router;
