import Homework from "../models/homework.model.js";
import HomeworkSubmission from "../models/homeworkSubmission.model.js";
import Student from "../models/student.model.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

// submit homework (Student)
export const submitHomework = async (req, res) => {
  try {
    const { homeworkId } = req.body;

    if (!homeworkId) {
      return res.status(400).json({ success: false, message: "homeworkId is required" });
    }

    // studentId hamesha logged-in user ke apne profile se lete hain, client se bheja studentId trust nahi karte
    const studentProfile = await Student.findOne({ userId: req.user._id });
    if (!studentProfile) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }
    const studentId = studentProfile._id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload your homework file" });
    }

    const homework = await Homework.findById(homeworkId);
    if (!homework) return res.status(404).json({ success: false, message: "Homework not found" });

    // Duplicate submission check - ek student ek homework do baar submit nahi kar sakta
    const existing = await HomeworkSubmission.findOne({ homeworkId, studentId });
    if (existing) {
      return res.status(400).json({ success: false, message: "You have already submitted this homework" });
    }

    const result = await uploadToCloudinary(req.file.buffer, "homework-submissions");

    const submittedAt = new Date();

    // Agar abhi ki date, dueDate se aage nikal chuki hai, "late" mark karo - Student ne khud kuch nahi bataya, humne khud calculate kiya
    const status = submittedAt > homework.dueDate ? "late" : "submitted";

    const submission = await HomeworkSubmission.create({
      homeworkId,
      studentId,
      submittedAt,
      attachment: { public_id: result.public_id, url: result.secure_url },
      status,
    });

    return res.status(201).json({
      success: true,
      message: status === "late" ? "Homework submitted (late)" : "Homework submitted successfully",
      data: submission,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// grade submission (Teacher)
export const gradeSubmission = async (req, res) => {
  try {
    const { marksAwarded, feedback } = req.body;

    if (marksAwarded === undefined || marksAwarded === null || marksAwarded === "") {
      return res.status(400).json({ success: false, message: "marksAwarded is required" });
    }

    const submission = await HomeworkSubmission.findById(req.params.id).populate(
      "homeworkId",
      "totalMarks"
    );
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });

    // Marks homework ke totalMarks se zyada nahi ho sakte
    const totalMarks = submission.homeworkId?.totalMarks ?? 100;
    if (Number(marksAwarded) < 0 || Number(marksAwarded) > totalMarks) {
      return res.status(400).json({
        success: false,
        message: `marksAwarded must be between 0 and ${totalMarks}`,
      });
    }

    const updated = await HomeworkSubmission.findByIdAndUpdate(
      req.params.id,
      { marksAwarded, feedback, status: "graded" },
      { new: true, runValidators: true }
    ).populate("homeworkId", "totalMarks");

    if (!updated) return res.status(404).json({ success: false, message: "Submission not found" });

    return res.status(200).json({
      success: true,
      message: "Submission graded successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get submissions for a homework (Teacher view)
export const getSubmissionsByHomework = async (req, res) => {
  try {
    const { homeworkId } = req.params;

    const submissions = await HomeworkSubmission.find({ homeworkId })
      .populate("studentId", "rollNo")
      .populate("homeworkId", "totalMarks title");

    return res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get submissions by student (Student's own history)
export const getSubmissionsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // "totalMarks" missing tha is select mein - isliye student ko "X / Y marks" nahi dikh pa raha tha
    const submissions = await HomeworkSubmission.find({ studentId }).populate({
      path: "homeworkId",
      select: "title dueDate subjectId totalMarks",
      populate: { path: "subjectId", select: "name" },
    });

    return res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
