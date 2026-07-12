import express from "express";
import {
  createStudent,
  createTeacher,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  uploadAvatar,
} from "../controllers/user.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// Sirf Admin naye Student/Teacher accounts bana sakta hai
router.post("/student", isAuthenticated, allowRoles("admin"), createStudent);
router.post("/teacher", isAuthenticated, allowRoles("admin"), createTeacher);

router.get("/", isAuthenticated, allowRoles("admin", "teacher"), getAllUsers);
router.get("/:id", isAuthenticated, allowRoles("admin", "teacher"), getUserById);

router.put("/:id", isAuthenticated, allowRoles("admin"), updateUser);
router.delete("/:id", isAuthenticated, allowRoles("admin"), deleteUser);

// upload.single("avatar") - "avatar" wahi field name hai jo Postman
// mein form-data ke andar file ke saath bhejna hoga
router.put(
  "/:id/avatar",
  isAuthenticated,
  allowRoles("admin", "teacher", "student"),
  upload.single("avatar"),
  uploadAvatar
);

export default router;
