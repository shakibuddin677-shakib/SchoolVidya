import mongoose from "mongoose";
import Subject from "../models/subject.model.js";
import Class from "../models/class.model.js";

// create subject
export const createSubject = async (req, res) => {
  try {
    const { name, code, classId } = req.body;

    if (!name || !code || !classId) {
      return res.status(400).json({
        success: false,
        message: "Name, code and classId are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: "Invalid classId" });
    }

    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const existingSubject = await Subject.findOne({ code: code.toUpperCase(), classId });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: "This subject code already exists in this class",
      });
    }

    const newSubject = await Subject.create({ name, code, classId });

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: newSubject,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ?classId=...
export const getAllSubjects = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { classId } = req.query;

    const filter = classId ? { classId } : {};

    const totalSubjects = await Subject.countDocuments(filter);

    const subjects = await Subject.find(filter)
      .populate("classId", "name academicYear")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: subjects,
      pagination: {
        total: totalSubjects,
        page,
        totalPages: Math.ceil(totalSubjects / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get single subject
export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate(
      "classId",
      "name academicYear"
    );

    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    return res.status(200).json({ success: true, data: subject });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// update subject
export const updateSubject = async (req, res) => {
  try {
    const { name, code } = req.body;

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, code },
      { new: true, runValidators: true }
    );

    if (!updatedSubject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: updatedSubject,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// delete subject
export const deleteSubject = async (req, res) => {
  try {
    const deletedSubject = await Subject.findByIdAndDelete(req.params.id);

    if (!deletedSubject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
