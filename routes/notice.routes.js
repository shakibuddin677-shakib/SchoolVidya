import express from "express";
import {
  createNotice,
  getActiveNotices,
  getAllNotices,
  updateNotice,
  deleteNotice,
} from "../controllers/notice.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", isAuthenticated, allowRoles("admin", "teacher"), createNotice);
router.get(
  "/active",
  isAuthenticated,
  allowRoles("admin", "teacher", "student"),
  getActiveNotices
);
router.get("/", isAuthenticated, allowRoles("admin"), getAllNotices);
router.put("/:id", isAuthenticated, allowRoles("admin", "teacher"), updateNotice);
router.delete("/:id", isAuthenticated, allowRoles("admin", "teacher"), deleteNotice);

export default router;
