import Timetable from "../models/timetable.model.js";
import Section from "../models/section.model.js";
import Subject from "../models/subject.model.js";

// ================== CREATE PERIOD (ek timetable slot add karo) ==================
export const createPeriod = async (req, res) => {
  try {
    const { sectionId, dayOfWeek, subjectId, teacherId, startTime, endTime } = req.body;

    if (!sectionId || !dayOfWeek || !subjectId || !teacherId || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const sectionExists = await Section.findById(sectionId);
    if (!sectionExists) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    const subjectExists = await Subject.findById(subjectId);
    if (!subjectExists) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    // TEACHER CLASH CHECK: yeh Teacher isi din, isi time pe
    // kisi AUR Section mein already busy to nahi hai
    const teacherClash = await Timetable.findOne({ teacherId, dayOfWeek, startTime });
    if (teacherClash) {
      return res.status(400).json({
        success: false,
        message: "This teacher is already assigned another class at this time",
      });
    }

    const newPeriod = await Timetable.create({
      sectionId,
      dayOfWeek,
      subjectId,
      teacherId,
      startTime,
      endTime,
    });

    return res.status(201).json({
      success: true,
      message: "Period added to timetable",
      data: newPeriod,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== GET TIMETABLE FOR A TEACHER (apna schedule) ==================
// Teacher Dashboard ke "Today's Class" widget ke liye - Section-wise nahi,
// seedha "yeh Teacher jahan-jahan padhata hai" wo saare periods
export const getTimetableByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const periods = await Timetable.find({ teacherId })
      .populate("subjectId", "name code")
      .populate("sectionId", "name")
      .sort({ dayOfWeek: 1, startTime: 1 });

    return res.status(200).json({ success: true, data: periods });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== GET TIMETABLE FOR A SECTION ==================
export const getTimetableBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    const periods = await Timetable.find({ sectionId })
      .populate("subjectId", "name code")
      .populate("teacherId", "name")
      .sort({ dayOfWeek: 1, startTime: 1 }); // pehle din ke hisaab se, phir time ke hisaab se sorted

    return res.status(200).json({ success: true, data: periods });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== UPDATE PERIOD ==================
export const updatePeriod = async (req, res) => {
  try {
    const { subjectId, teacherId, startTime, endTime } = req.body;

    const updated = await Timetable.findByIdAndUpdate(
      req.params.id,
      { subjectId, teacherId, startTime, endTime },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Period not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Period updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== DELETE PERIOD ==================
export const deletePeriod = async (req, res) => {
  try {
    const deleted = await Timetable.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Period not found" });
    }

    return res.status(200).json({ success: true, message: "Period deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
