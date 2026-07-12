import express from "express";
import {
  createFeeStructure,
  getFeeStructures,
  updateFeeStructure,
  deleteFeeStructure,
} from "../controllers/feeStructure.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", isAuthenticated, allowRoles("admin"), createFeeStructure);
router.get("/", isAuthenticated, allowRoles("admin", "teacher"), getFeeStructures);
router.put("/:id", isAuthenticated, allowRoles("admin"), updateFeeStructure);
router.delete("/:id", isAuthenticated, allowRoles("admin"), deleteFeeStructure);

export default router;
