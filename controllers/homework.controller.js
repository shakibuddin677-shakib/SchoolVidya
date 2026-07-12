import Homework from "../models/homework.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryUpload.js";

// ================== CREATE HOMEWORK (Teacher assigns) ==================
// Attachment OPTIONAL hai - agar Teacher ne file bheji hai (req.file),
// tabhi Cloudinary pe upload karo
export const createHomework = async (req, res) => {
  try {
    const { sectionId, subjectId, title, description, dueDate, totalMarks } = req.body;

    if (!sectionId || !subjectId || !title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "sectionId, subjectId, title and dueDate are required",
      });
    }

    if (totalMarks !== undefined && (Number(totalMarks) < 1 || Number(totalMarks) > 20)) {
      return res.status(400).json({ success: false, message: "totalMarks must be between 1 and 20" });
    }

    let attachment = { public_id: "", url: "" };

    // req.file sirf tab exist karega jab Postman mein file bheji gayi ho
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "homework");
      attachment = { public_id: result.public_id, url: result.secure_url };
    }

    const newHomework = await Homework.create({
      sectionId,
      subjectId,
      teacherId: req.user._id, // auth.middleware se milta hai
      title,
      description,
      attachment,
      dueDate,
      totalMarks: totalMarks || 20,
    });

    return res.status(201).json({
      success: true,
      message: "Homework assigned successfully",
      data: newHomework,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== GET HOMEWORK BY SECTION ==================
export const getHomeworkBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { subjectId } = req.query;

    const filter = subjectId ? { sectionId, subjectId } : { sectionId };

    const homework = await Homework.find(filter)
      .populate("subjectId", "name code")
      .populate("teacherId", "name")
      .sort({ dueDate: 1 }); // jaldi due hone wala sabse upar

    return res.status(200).json({ success: true, data: homework });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== GET SINGLE HOMEWORK ==================
export const getHomeworkById = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id)
      .populate("subjectId", "name code")
      .populate("teacherId", "name");

    if (!homework) return res.status(404).json({ success: false, message: "Homework not found" });

    return res.status(200).json({ success: true, data: homework });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== UPDATE HOMEWORK ==================
export const updateHomework = async (req, res) => {
  try {
    const { title, description, dueDate, totalMarks } = req.body;

    if (totalMarks !== undefined && (Number(totalMarks) < 1 || Number(totalMarks) > 20)) {
      return res.status(400).json({ success: false, message: "totalMarks must be between 1 and 20" });
    }

    const updated = await Homework.findByIdAndUpdate(
      req.params.id,
      { title, description, dueDate, totalMarks },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Homework not found" });

    return res.status(200).json({
      success: true,
      message: "Homework updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== DELETE HOMEWORK ==================
export const deleteHomework = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id);
    if (!homework) return res.status(404).json({ success: false, message: "Homework not found" });

    // Agar attachment thi, Cloudinary se bhi delete kar do (warna storage mein bekar padi rahegi)
    if (homework.attachment?.public_id) {
      await deleteFromCloudinary(homework.attachment.public_id);
    }

    await Homework.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, message: "Homework deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
