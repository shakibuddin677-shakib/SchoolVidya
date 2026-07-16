import express from "express";
import {
  payFee,
  getFeeStatusByStudent,
  getPaymentsByStructure,
  getPaymentHistoryByStudent,
  getFeeReceiptById,
} from "../controllers/feePayment.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";
import verifyStudentSelf from "../middleware/ownership.middleware.js";

const router = express.Router();

router.post("/pay", isAuthenticated, allowRoles("admin"), payFee);
router.get(
  "/student/:studentId",
  isAuthenticated,
  allowRoles("admin", "teacher", "student"),
  verifyStudentSelf,
  getFeeStatusByStudent
);
router.get(
  "/structure/:feeStructureId",
  isAuthenticated,
  allowRoles("admin"),
  getPaymentsByStructure
);

// Fee Receipt - payment history list (fee page) + single receipt detail
router.get(
  "/student/:studentId/receipts",
  isAuthenticated,
  allowRoles("admin", "teacher", "student"),
  verifyStudentSelf,
  getPaymentHistoryByStudent
);
router.get(
  "/receipt/:paymentId",
  isAuthenticated,
  allowRoles("admin", "teacher", "student"),
  getFeeReceiptById
);

export default router;
