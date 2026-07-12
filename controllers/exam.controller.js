import Exam from "../models/exam.model.js";
import ExamSchedule from "../models/examSchedule.model.js";
import Result from "../models/result.model.js";
import Student from "../models/student.model.js";

// ================== CREATE EXAM ==================
export const createExam = async (req, res) => {
  try {
    const { name, classId, term, startDate, endDate } = req.body;

    if (!name || !classId || !term || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newExam = await Exam.create({ name, classId, term, startDate, endDate });

    return res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: newExam,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== GET ALL EXAMS ==================
export const getAllExams = async (req, res) => {
  try {
    const { classId } = req.query;
    const filter = classId ? { classId } : {};

    const exams = await Exam.find(filter)
      .populate("classId", "name academicYear")
      .sort({ startDate: -1 });

    return res.status(200).json({ success: true, data: exams });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== GET SINGLE EXAM ==================
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("classId", "name academicYear");

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    return res.status(200).json({ success: true, data: exam });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== UPDATE EXAM ==================
export const updateExam = async (req, res) => {
  try {
    const updatedExam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedExam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Exam updated successfully",
      data: updatedExam,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== DELETE EXAM ==================
export const deleteExam = async (req, res) => {
  try {
    const deletedExam = await Exam.findByIdAndDelete(req.params.id);

    if (!deletedExam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    return res.status(200).json({ success: true, message: "Exam deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== HELPER: is Exam's saare subjects ke marks complete hain? ==================
// Har ExamSchedule (= 1 subject ka paper) ke liye check karta hai ki
// class ke SAARE enrolled students ke marks enter ho chuke hain ya nahi.
// Admin/Teacher dono is helper ka result dekh sakte hain (result-status
// endpoint), aur Release karte waqt yehi check backend khud bhi dobara
// (authoritative) chalata hai - frontend ki baat par bharosa nahi karta.
const computeExamCompletion = async (examId, classId) => {
  const schedules = await ExamSchedule.find({ examId }).populate("subjectId", "name");
  const totalStudents = await Student.countDocuments({ classId });

  const subjects = await Promise.all(
    schedules.map(async (schedule) => {
      const resultsEntered = await Result.countDocuments({ examScheduleId: schedule._id });
      return {
        examScheduleId: schedule._id,
        subjectName: schedule.subjectId?.name || "Unknown Subject",
        maxMarks: schedule.maxMarks,
        totalStudents,
        resultsEntered,
        // Agar class mein koi student hi nahi hai to "complete" maan lo -
        // warna 0/0 hamesha "incomplete" dikhta rehta
        isComplete: totalStudents === 0 || resultsEntered >= totalStudents,
      };
    })
  );

  // Kam se kam ek subject schedule hona chahiye, aur SAB subjects complete
  // hone chahiye - tabhi "sab subjects ke marks assign ho chuke hain" maana jayega
  const overallComplete = subjects.length > 0 && subjects.every((s) => s.isComplete);

  return { totalStudents, subjects, overallComplete };
};

// ================== GET EXAM RESULT STATUS (subject-wise completion) ==================
// Admin ko yeh dikhane ke liye ki "Release Results" dabane se pehle kaunse
// subjects ke marks abhi bhi pending hain
export const getExamResultStatus = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    const { totalStudents, subjects, overallComplete } = await computeExamCompletion(exam._id, exam.classId);

    return res.status(200).json({
      success: true,
      data: {
        isPublished: exam.isPublished,
        publishedAt: exam.publishedAt,
        totalStudents,
        subjects,
        overallComplete,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== RELEASE RESULTS (bulk publish - Students ko ab dikhega) ==================
export const releaseExamResults = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    // AUTHORITATIVE CHECK: bhale hi frontend ne "sab complete hai" dikhaya ho,
    // yahan dobara verify karte hain - warna kisi race condition (jaise ek
    // Teacher ne beech mein marks edit kar diye) mein incomplete results
    // publish ho sakte the
    const { subjects, overallComplete } = await computeExamCompletion(exam._id, exam.classId);

    if (!overallComplete) {
      const pendingSubjects = subjects.filter((s) => !s.isComplete).map((s) => s.subjectName);
      return res.status(400).json({
        success: false,
        message:
          subjects.length === 0
            ? "Is exam ke liye abhi koi subject schedule hi nahi hua hai"
            : `Results release nahi ho sakte - in subjects ke marks abhi complete nahi hain: ${pendingSubjects.join(", ")}`,
      });
    }

    exam.isPublished = true;
    exam.publishedAt = new Date();
    await exam.save();

    return res.status(200).json({
      success: true,
      message: "Results released successfully - students can now see their marks",
      data: exam,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== UNPUBLISH RESULTS (galti se release ho jaye to wapas rok sako) ==================
export const unpublishExamResults = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { isPublished: false, publishedAt: null },
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Results hidden from students again",
      data: exam,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
