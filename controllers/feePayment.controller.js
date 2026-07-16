import mongoose from "mongoose";
import FeePayment from "../models/feePayment.model.js";
import FeeStructure from "../models/feeStructure.model.js";
import Student from "../models/student.model.js";
import { ensureCurrentMonthTuitionFees } from "../utils/feeAutomation.js";

// pay fee (ek transaction record banao)
export const payFee = async (req, res) => {
  try {
    const { studentId, feeStructureId, amountPaid, paymentMode, transactionId } = req.body;

    if (!studentId || !feeStructureId || !amountPaid || !paymentMode) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(feeStructureId)) {
      return res.status(400).json({ success: false, message: "Invalid feeStructureId" });
    }

    const feeStructure = await FeeStructure.findById(feeStructureId);
    if (!feeStructure) {
      return res.status(404).json({ success: false, message: "Fee structure not found" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Receipt Number generate karo - format "RCPT/<year>/00001".
    const year = new Date().getFullYear();
    const countThisYear = await FeePayment.countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
        $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
      },
    });
    const receiptNo = `RCPT/${year}/${String(countThisYear + 1).padStart(5, "0")}`;

    const payment = await FeePayment.create({
      studentId,
      feeStructureId,
      amountPaid,
      paymentMode,
      transactionId,
      receiptNo,
    });

    // receipt turant UI mein dikhana hai isliye poora populated data (student, class, feeStructure) yahin wapas bhej dete hain
    const populatedPayment = await FeePayment.findById(payment._id)
      .populate({
        path: "studentId",
        populate: [
          { path: "userId", select: "name" },
          { path: "classId", select: "name academicYear" },
          { path: "sectionId", select: "name" },
          { path: "parentId", select: "name" },
        ],
      })
      .populate("feeStructureId");

    return res.status(201).json({
      success: true,
      message: "Fee payment recorded successfully",
      data: populatedPayment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Yeh sabse important function hai - Class ke saare fee types dikhata hai, har ek ke liye "kitna pay hua, kitna baaki hai"
export const getFeeStatusByStudent = async (req, res) => {
  try {
    // Turant catch-up - agar is student ki class ka current month ka Tuition Fee structure abhi tak nahi bana, to yahin bana do
    await ensureCurrentMonthTuitionFees();

    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Is student ki Class ke liye jitne bhi fee types (menu card) define hain
    const feeStructures = await FeeStructure.find({ classId: student.classId });

    // Is student ne ab tak jitni bhi payments ki hain (poori history)
    const payments = await FeePayment.find({ studentId });

    // Har fee type ke liye alag se calculate karo
    const feeStatus = feeStructures.map((structure) => {
      // filter(): sirf isi feeStructure se related payments chuno
      const paymentsForThisFee = payments.filter(
        (p) => p.feeStructureId.toString() === structure._id.toString()
      );

      // reduce(): un sab payments ka total nikalo (0 se start karke add karte jao)
      const totalPaid = paymentsForThisFee.reduce((sum, p) => sum + p.amountPaid, 0);

      return {
        feeStructureId: structure._id, // frontend ko "Pay Fee" karte waqt yeh ID chahiye
        feeType: structure.feeType,
        term: structure.term,
        month: structure.month, // Tuition Fee ke liye - "YYYY-MM" (baaki fee types ke liye "")
        dueDate: structure.dueDate,
        totalAmount: structure.amount,
        paidAmount: totalPaid,
        pendingAmount: structure.amount - totalPaid,
        status: totalPaid >= structure.amount ? "paid" : totalPaid > 0 ? "partial" : "unpaid",
      };
    });

    // Overall summary (sab fee types milaakar)
    const totalDue = feeStatus.reduce((sum, f) => sum + f.totalAmount, 0);
    const totalPaidOverall = feeStatus.reduce((sum, f) => sum + f.paidAmount, 0);

    return res.status(200).json({
      success: true,
      data: feeStatus,
      summary: {
        totalDue,
        totalPaid: totalPaidOverall,
        totalPending: totalDue - totalPaidOverall,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Student ki ab tak ki saari payments (receipts) - naye se purane order mein.
export const getPaymentHistoryByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const payments = await FeePayment.find({ studentId })
      .populate("feeStructureId", "feeType term month amount billingType")
      .sort({ paymentDate: -1 });

    return res.status(200).json({ success: true, data: payments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ek specific payment ki poori detail - student, class, feeStructure aur ab tak ka total paid/balance
export const getFeeReceiptById = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ success: false, message: "Invalid paymentId" });
    }

    const payment = await FeePayment.findById(paymentId)
      .populate({
        path: "studentId",
        populate: [
          { path: "userId", select: "name" },
          { path: "classId", select: "name academicYear" },
          { path: "sectionId", select: "name" },
          { path: "parentId", select: "name" },
        ],
      })
      .populate("feeStructureId");

    if (!payment) {
      return res.status(404).json({ success: false, message: "Receipt not found" });
    }

    // student sirf apni hi receipt dekh sakta hai (admin/teacher ke liye koi restriction nahi - route mein already unke roles allowRoles se check ho chuke hain)
    if (req.user.role === "student") {
      const ownProfile = await Student.findOne({ userId: req.user._id }).select("_id");
      if (!ownProfile || ownProfile._id.toString() !== payment.studentId._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only view your own receipt.",
        });
      }
    }

    // Balance Due nikaalne ke liye - is student ne isi feeStructure (jaise "Tuition Fee") par ab tak total kitna pay kiya hai
    const allPaymentsForStructure = await FeePayment.find({
      studentId: payment.studentId._id,
      feeStructureId: payment.feeStructureId._id,
    });
    const totalPaidForStructure = allPaymentsForStructure.reduce(
      (sum, p) => sum + p.amountPaid,
      0
    );

    // pehle sirf isi fee ka balance dikhta tha, ab class ke saare fee types milaake overall pending bhi bhej rahe hain
    const allFeeStructuresForClass = await FeeStructure.find({
      classId: payment.studentId.classId._id,
    });
    const allPaymentsForStudent = await FeePayment.find({ studentId: payment.studentId._id });

    const overallTotalDue = allFeeStructuresForClass.reduce((sum, s) => sum + s.amount, 0);
    const overallTotalPaid = allFeeStructuresForClass.reduce((sum, structure) => {
      const paidForThis = allPaymentsForStudent
        .filter((p) => p.feeStructureId.toString() === structure._id.toString())
        .reduce((s, p) => s + p.amountPaid, 0);
      // Ek fee type par jitna zyada se zyada "due" count hota hai wo uski apni amount tak hi seemit hai (overpay ho to bhi wo doosri fee ki kami pura nahi karta)
      return sum + Math.min(paidForThis, structure.amount);
    }, 0);

    return res.status(200).json({
      success: true,
      data: {
        ...payment.toObject(),
        totalPaidForStructure,
        balanceDue: payment.feeStructureId.amount - totalPaidForStructure,
        overallTotalDue,
        overallTotalPaid,
        overallTotalPending: overallTotalDue - overallTotalPaid,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// "Sabne Tuition Fee kitna pay kiya" jaisa report
export const getPaymentsByStructure = async (req, res) => {
  try {
    const { feeStructureId } = req.params;

    const payments = await FeePayment.find({ feeStructureId }).populate("studentId", "rollNo");

    return res.status(200).json({ success: true, data: payments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
