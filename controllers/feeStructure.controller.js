import FeeStructure from "../models/feeStructure.model.js";
import { ensureCurrentMonthTuitionFees } from "../utils/feeAutomation.js";

// create fee structure
export const createFeeStructure = async (req, res) => {
  try {
    const { classId, term, month, feeType, amount, dueDate } = req.body;

    if (!classId || !feeType || !amount) {
      return res.status(400).json({ success: false, message: "Class, fee type, and amount are required" });
    }

    // "Tuition Fee" MONTH-wise hai, baaki sab fee types TERM-wise (jaise pehle the) - is se decide hota hai konsa field required hai
    const billingType = feeType === "Tuition Fee" ? "month" : "term";

    if (billingType === "month" && !month) {
      return res.status(400).json({ success: false, message: "Month is required for Tuition Fee" });
    }
    if (billingType === "term" && !term) {
      return res.status(400).json({ success: false, message: "Term is required for this fee type" });
    }

    const existing = await FeeStructure.findOne({
      classId,
      feeType,
      term: billingType === "term" ? term : "",
      month: billingType === "month" ? month : "",
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `This fee type already exists for this class and ${billingType === "month" ? "month" : "term"}`,
      });
    }

    const newStructure = await FeeStructure.create({
      classId,
      feeType,
      billingType,
      term: billingType === "term" ? term : "",
      month: billingType === "month" ? month : "",
      amount,
      dueDate,
    });

    return res.status(201).json({
      success: true,
      message: "Fee structure created successfully",
      data: newStructure,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get fee structures (class ke saare fee types)
export const getFeeStructures = async (req, res) => {
  try {
    // Admin jab bhi Fee Structures dekhta hai, pehle turant check kar lo ki kisi class ka current month ka Tuition Fee structure to missing nahi hai
    await ensureCurrentMonthTuitionFees();

    const { classId } = req.query;
    const filter = classId ? { classId } : {};

    const structures = await FeeStructure.find(filter)
      .populate("classId", "name academicYear")
      .sort({ month: -1, term: 1 });

    return res.status(200).json({ success: true, data: structures });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// update fee structure
export const updateFeeStructure = async (req, res) => {
  try {
    const { term, month, feeType, amount, dueDate } = req.body;

    const updated = await FeeStructure.findByIdAndUpdate(
      req.params.id,
      { term, month, feeType, amount, dueDate },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Fee structure not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Fee structure updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// delete fee structure
export const deleteFeeStructure = async (req, res) => {
  try {
    const deleted = await FeeStructure.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Fee structure not found" });
    }

    return res.status(200).json({ success: true, message: "Fee structure deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
