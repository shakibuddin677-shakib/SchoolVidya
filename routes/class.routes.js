import express from "express";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
} from "../controllers/class.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";

const router = express.Router();

// Har route pehle "isAuthenticated" (ID check) se guzarta hai,
// phir "allowRoles" (permission check) se - order IMPORTANT hai
// kyunki allowRoles ko req.user chahiye jo isAuthenticated banata hai

// Sirf Admin naya class bana sakta hai
router.post("/", isAuthenticated, allowRoles("admin"), createClass);

// Admin aur Teacher dono classes dekh sakte hain
router.get("/", isAuthenticated, allowRoles("admin", "teacher"), getAllClasses);
router.get("/:id", isAuthenticated, allowRoles("admin", "teacher"), getClassById);

// Sirf Admin edit/delete kar sakta hai
router.put("/:id", isAuthenticated, allowRoles("admin"), updateClass);
router.delete("/:id", isAuthenticated, allowRoles("admin"), deleteClass);

export default router;
