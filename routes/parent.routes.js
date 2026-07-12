import express from "express";
import {
  createParent,
  getAllParents,
  updateParent,
  deleteParent,
} from "../controllers/parent.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", isAuthenticated, allowRoles("admin"), createParent);
router.get("/", isAuthenticated, allowRoles("admin", "teacher"), getAllParents);
router.put("/:id", isAuthenticated, allowRoles("admin"), updateParent);
router.delete("/:id", isAuthenticated, allowRoles("admin"), deleteParent);

export default router;
