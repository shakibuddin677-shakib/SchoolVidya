import Notice from "../models/notice.model.js";

// create notice
export const createNotice = async (req, res) => {
  try {
    const { title, description, targetAudience, expiryDate } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description are required" });
    }

    const newNotice = await Notice.create({
      title,
      description,
      targetAudience: targetAudience || "all",
      createdBy: req.user._id, // auth.middleware se milta hai
      expiryDate,
    });

    return res.status(201).json({
      success: true,
      message: "Notice created successfully",
      data: newNotice,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Student/Teacher jab apna dashboard kholega, yahi API call hoga - sirf UNKE liye relevant, abhi tak valid notices dikhenge
export const getActiveNotices = async (req, res) => {
  try {
    const userRole = req.user.role; // "student", "teacher", ya "admin"

    // Role ko uske "audience group" se map karo
    const audienceMap = { student: "students", teacher: "teachers", admin: "all" };
    const relevantAudience = audienceMap[userRole] || "all";

    const notices = await Notice.find({
      // targetAudience "all" HO, YA specifically is role ke group ke liye ho
      targetAudience: { $in: ["all", relevantAudience] },
      // expiryDate set hi nahi hai, YA abhi tak future mein hai
      $or: [{ expiryDate: null }, { expiryDate: { $gte: new Date() } }],
    })
      .populate("createdBy", "name")
      .sort({ publishDate: -1 }); // sabse naya notice sabse upar

    return res.status(200).json({ success: true, data: notices });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get all notices (admin - expired bhi dikhega)
export const getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find().populate("createdBy", "name").sort({ publishDate: -1 });

    return res.status(200).json({ success: true, data: notices });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// update notice
export const updateNotice = async (req, res) => {
  try {
    const { title, description, targetAudience, expiryDate } = req.body;

    const updated = await Notice.findByIdAndUpdate(
      req.params.id,
      { title, description, targetAudience, expiryDate },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Notice not found" });

    return res.status(200).json({
      success: true,
      message: "Notice updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// delete notice
export const deleteNotice = async (req, res) => {
  try {
    const deleted = await Notice.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Notice not found" });

    return res.status(200).json({ success: true, message: "Notice deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
