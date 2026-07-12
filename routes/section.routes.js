import express from "express";
import {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
} from "../controllers/section.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", isAuthenticated, allowRoles("admin"), createSection);
router.get("/", isAuthenticated, allowRoles("admin", "teacher"), getAllSections);
router.get("/:id", isAuthenticated, allowRoles("admin", "teacher"), getSectionById);
router.put("/:id", isAuthenticated, allowRoles("admin"), updateSection);
router.delete("/:id", isAuthenticated, allowRoles("admin"), deleteSection);

export default router;
