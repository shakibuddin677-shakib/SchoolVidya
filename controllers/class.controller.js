import Class from "../models/class.model.js";
import Student from "../models/student.model.js";
import Section from "../models/section.model.js";
import Subject from "../models/subject.model.js";
import FeeStructure from "../models/feeStructure.model.js";
import FeePayment from "../models/feePayment.model.js";
import Exam from "../models/exam.model.js";
import ExamSchedule from "../models/examSchedule.model.js";
import Result from "../models/result.model.js";
import Timetable from "../models/timetable.model.js";

// ================== CREATE CLASS ==================
// Sirf Admin isko call kar payega (role.middleware route mein check karega)
export const createClass = async (req, res) => {
  try {
    const { name, academicYear } = req.body;

    if (!name || !academicYear) {
      return res.status(400).json({
        success: false,
        message: "Class name and academic year are required",
      });
    }

    // Duplicate check pehle se kar lete hain, taaki user ko
    // Mongoose ki confusing "duplicate key" error ke bajaye
    // ek clean message mile
    const existingClass = await Class.findOne({ name, academicYear });
    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: "This class already exists for this academic year",
      });
    }

    const newClass = await Class.create({ name, academicYear });

    // 201 = "Created" - jab naya resource successfully ban jaye
    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: newClass,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== GET ALL CLASSES ==================
// Pagination + search dono support karta hai
// Example: GET /api/classes?page=1&limit=10&search=grade
export const getAllClasses = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";

    // $regex "options: i" ka matlab case-insensitive search
    // (user "grade" likhe ya "Grade", dono match honge)
    const filter = search ? { name: { $regex: search, $options: "i" } } : {};

    // Total count nikalna zaroori hai taaki frontend ko pata chale
    // kitne total pages hain (page 1, 2, 3...)
    const totalClasses = await Class.countDocuments(filter);

    const classes = await Class.find(filter)
      .sort({ createdAt: -1 }) // sabse naya document sabse upar
      .skip((page - 1) * limit) // pichhle pages ke records skip karo
      .limit(limit); // sirf itne hi records is page pe do

    return res.status(200).json({
      success: true,
      data: classes,
      pagination: {
        total: totalClasses,
        page,
        totalPages: Math.ceil(totalClasses / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== GET SINGLE CLASS ==================
export const getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    return res.status(200).json({ success: true, data: classData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== UPDATE CLASS ==================
export const updateClass = async (req, res) => {
  try {
    const { name, academicYear } = req.body;

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { name, academicYear },
      {
        new: true, // true na ho to yeh PURANA document return karega, naya nahi
        runValidators: true, // schema validation (required, trim) update pe bhi chale
      }
    );

    if (!updatedClass) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: updatedClass,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== DELETE CLASS ==================
export const deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;

    // SAFETY CHECK: agar is Class mein abhi bhi Students hain, delete mat
    // hone do - warna un Students ka classId/sectionId "dangling reference"
    // ban jayega (bilkul jaisa Parent delete ke liye pehle kiya tha)
    const studentCount = await Student.countDocuments({ classId });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete - ${studentCount} student(s) still belong to this class. Move or remove them first.`,
      });
    }

    // Ab Class mein koi Student nahi hai, isliye uski saari "child" records
    // safely cascade-delete kar sakte hain
    const sections = await Section.find({ classId }).select("_id");
    const sectionIds = sections.map((s) => s._id);

    const exams = await Exam.find({ classId }).select("_id");
    const examIds = exams.map((e) => e._id);

    const examSchedules = await ExamSchedule.find({ examId: { $in: examIds } }).select("_id");
    const scheduleIds = examSchedules.map((s) => s._id);

    const feeStructures = await FeeStructure.find({ classId }).select("_id");
    const feeStructureIds = feeStructures.map((f) => f._id);

    await Promise.all([
      Result.deleteMany({ examScheduleId: { $in: scheduleIds } }),
      ExamSchedule.deleteMany({ examId: { $in: examIds } }),
      Exam.deleteMany({ classId }),
      FeePayment.deleteMany({ feeStructureId: { $in: feeStructureIds } }),
      FeeStructure.deleteMany({ classId }),
      Timetable.deleteMany({ sectionId: { $in: sectionIds } }),
      Subject.deleteMany({ classId }),
      Section.deleteMany({ classId }),
    ]);

    const deletedClass = await Class.findByIdAndDelete(classId);

    if (!deletedClass) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Class and all related records deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
