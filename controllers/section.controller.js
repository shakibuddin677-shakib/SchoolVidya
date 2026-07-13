import mongoose from "mongoose";
import Section from "../models/section.model.js";
import Class from "../models/class.model.js";
import User from "../models/user.model.js";

// ================== CREATE SECTION ==================
export const createSection = async (req, res) => {
  try {
    const { name, classId, classTeacherId } = req.body;

    if (!name || !classId) {
      return res.status(400).json({
        success: false,
        message: "Section name and classId are required",
      });
    }

    // classId ek valid MongoDB ObjectId format mein hai ya nahi -
    // yeh check pehle na karo to agla step (findById) crash kar sakta hai
    // agar koi random string bhej de
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: "Invalid classId" });
    }

    // "Foreign key" MongoDB khud check nahi karta (SQL ke uljat),
    // isliye humein khud verify karna padta hai ki yeh Class sach mein exist karta hai
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const existingSection = await Section.findOne({ name, classId });
    if (existingSection) {
      return res.status(400).json({
        success: false,
        message: "This section already exists in this class",
      });
    }

    // Agar classTeacherId diya hai, verify karo ki wo ek valid ObjectId hai
    // aur sach mein ek "teacher" role wale User se belong karta hai
    if (classTeacherId) {
      if (!mongoose.Types.ObjectId.isValid(classTeacherId)) {
        return res.status(400).json({ success: false, message: "Invalid classTeacherId" });
      }
      const teacherUser = await User.findOne({ _id: classTeacherId, role: "teacher" });
      if (!teacherUser) {
        return res.status(404).json({ success: false, message: "Class teacher not found" });
      }
    }

    const newSection = await Section.create({ name, classId, classTeacherId: classTeacherId || null });

    return res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: newSection,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== GET ALL SECTIONS ==================
// ?classId=... se ek specific class ke sections filter kar sakte ho
export const getAllSections = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { classId } = req.query;

    const filter = classId ? { classId } : {};

    const totalSections = await Section.countDocuments(filter);

    const sections = await Section.find(filter)
      // populate(field, "sirf yeh fields chahiye") - poora document nahi laate,
      // sirf jitna zaroorat hai, taaki response halka rahe
      .populate("classId", "name academicYear")
      .populate("classTeacherId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: sections,
      pagination: {
        total: totalSections,
        page,
        totalPages: Math.ceil(totalSections / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== GET SINGLE SECTION ==================
export const getSectionById = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate("classId", "name academicYear")
      .populate("classTeacherId", "name email");

    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    return res.status(200).json({ success: true, data: section });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== UPDATE SECTION ==================
export const updateSection = async (req, res) => {
  try {
    const { name, classTeacherId } = req.body;

    if (classTeacherId) {
      if (!mongoose.Types.ObjectId.isValid(classTeacherId)) {
        return res.status(400).json({ success: false, message: "Invalid classTeacherId" });
      }
      const teacherUser = await User.findOne({ _id: classTeacherId, role: "teacher" });
      if (!teacherUser) {
        return res.status(404).json({ success: false, message: "Class teacher not found" });
      }
    }

    // classTeacherId "" ya null bhej kar bhi clear kiya ja sakta hai
    const updates = { name };
    if (classTeacherId !== undefined) {
      updates.classTeacherId = classTeacherId || null;
    }

    const updatedSection = await Section.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedSection) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Section updated successfully",
      data: updatedSection,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== DELETE SECTION ==================
export const deleteSection = async (req, res) => {
  try {
    const deletedSection = await Section.findByIdAndDelete(req.params.id);

    if (!deletedSection) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
import mongoose from "mongoose";
import Section from "../models/section.model.js";
import Class from "../models/class.model.js";
import User from "../models/user.model.js";
import Student from "../models/student.model.js";
import Timetable from "../models/timetable.model.js";

// ================== CREATE SECTION ==================
export const createSection = async (req, res) => {
  try {
    const { name, classId, classTeacherId } = req.body;

    if (!name || !classId) {
      return res.status(400).json({
        success: false,
        message: "Section name and classId are required",
      });
    }

    // classId ek valid MongoDB ObjectId format mein hai ya nahi -
    // yeh check pehle na karo to agla step (findById) crash kar sakta hai
    // agar koi random string bhej de
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: "Invalid classId" });
    }

    // "Foreign key" MongoDB khud check nahi karta (SQL ke uljat),
    // isliye humein khud verify karna padta hai ki yeh Class sach mein exist karta hai
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const existingSection = await Section.findOne({ name, classId });
    if (existingSection) {
      return res.status(400).json({
        success: false,
        message: "This section already exists in this class",
      });
    }

    // Agar classTeacherId diya hai, verify karo ki wo ek valid ObjectId hai
    // aur sach mein ek "teacher" role wale User se belong karta hai
    if (classTeacherId) {
      if (!mongoose.Types.ObjectId.isValid(classTeacherId)) {
        return res.status(400).json({ success: false, message: "Invalid classTeacherId" });
      }
      const teacherUser = await User.findOne({ _id: classTeacherId, role: "teacher" });
      if (!teacherUser) {
        return res.status(404).json({ success: false, message: "Class teacher not found" });
      }
    }

    const newSection = await Section.create({ name, classId, classTeacherId: classTeacherId || null });

    return res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: newSection,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== GET ALL SECTIONS ==================
// ?classId=... se ek specific class ke sections filter kar sakte ho
export const getAllSections = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { classId } = req.query;

    const filter = classId ? { classId } : {};

    const totalSections = await Section.countDocuments(filter);

    const sections = await Section.find(filter)
      // populate(field, "sirf yeh fields chahiye") - poora document nahi laate,
      // sirf jitna zaroorat hai, taaki response halka rahe
      .populate("classId", "name academicYear")
      .populate("classTeacherId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: sections,
      pagination: {
        total: totalSections,
        page,
        totalPages: Math.ceil(totalSections / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== GET SINGLE SECTION ==================
export const getSectionById = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate("classId", "name academicYear")
      .populate("classTeacherId", "name email");

    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    return res.status(200).json({ success: true, data: section });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== UPDATE SECTION ==================
export const updateSection = async (req, res) => {
  try {
    const { name, classTeacherId } = req.body;

    if (classTeacherId) {
      if (!mongoose.Types.ObjectId.isValid(classTeacherId)) {
        return res.status(400).json({ success: false, message: "Invalid classTeacherId" });
      }
      const teacherUser = await User.findOne({ _id: classTeacherId, role: "teacher" });
      if (!teacherUser) {
        return res.status(404).json({ success: false, message: "Class teacher not found" });
      }
    }

    // classTeacherId "" ya null bhej kar bhi clear kiya ja sakta hai
    const updates = { name };
    if (classTeacherId !== undefined) {
      updates.classTeacherId = classTeacherId || null;
    }

    const updatedSection = await Section.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedSection) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Section updated successfully",
      data: updatedSection,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== DELETE SECTION ==================
export const deleteSection = async (req, res) => {
  try {
    const sectionId = req.params.id;

    // BUG FIX: pehle yahan koi check nahi tha - Section delete hone se
    // uske andar ke Students ka "sectionId" ek dangling reference ban
    // jaata tha (bilkul waisa hi jaisa deleteClass mein Class ke liye
    // pehle se handle kiya gaya hai). Ab Class ki tarah hi, agar Section
    // mein abhi bhi Students hain, delete block kar dete hain.
    const studentCount = await Student.countDocuments({ sectionId });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete - ${studentCount} student(s) still belong to this section. Move or remove them first.`,
      });
    }

    // Section ke apne timetable periods bhi saaf karo, warna woh orphan
    // ho jaate (ek deleted section ko point karte reh jaate)
    await Timetable.deleteMany({ sectionId });

    const deletedSection = await Section.findByIdAndDelete(sectionId);

    if (!deletedSection) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
