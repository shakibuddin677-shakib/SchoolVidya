import mongoose from "mongoose";
import ExamSchedule from "../models/examSchedule.model.js";
import Exam from "../models/exam.model.js";
import Subject from "../models/subject.model.js";

// create exam schedule (ek Subject ka paper add karo)
export const createExamSchedule = async (req, res) => {
  try {
    const { examId, subjectId, date, maxMarks } = req.body;

    if (!examId || !subjectId || !date) {
      return res.status(400).json({
        success: false,
        message: "examId, subjectId aur date required hain",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(examId) || !mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ success: false, message: "Invalid examId or subjectId" });
    }

    // Dono foreign keys sach mein exist karte hain ya nahi, check karo
    const examExists = await Exam.findById(examId);
    if (!examExists) return res.status(404).json({ success: false, message: "Exam not found" });

    const subjectExists = await Subject.findById(subjectId);
    if (!subjectExists)
      return res.status(404).json({ success: false, message: "Subject not found" });

    const newSchedule = await ExamSchedule.create({ examId, subjectId, date, maxMarks });

    return res.status(201).json({
      success: true,
      message: "Exam schedule created successfully",
      data: newSchedule,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Poore Exam ka "timetable" - kaunsa subject kis din
export const getSchedulesByExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const schedules = await ExamSchedule.find({ examId })
      .populate("subjectId", "name code")
      .sort({ date: 1 }); // sabse pehle wali date sabse upar

    return res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// update exam schedule
export const updateExamSchedule = async (req, res) => {
  try {
    const { date, maxMarks } = req.body;

    const updated = await ExamSchedule.findByIdAndUpdate(
      req.params.id,
      { date, maxMarks },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Exam schedule not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Exam schedule updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// delete exam schedule
export const deleteExamSchedule = async (req, res) => {
  try {
    const deleted = await ExamSchedule.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Exam schedule not found" });
    }

    return res.status(200).json({ success: true, message: "Exam schedule deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
