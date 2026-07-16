import Student from "../models/student.model.js";

// several "student self-service" routes
const verifyStudentSelf = async (req, res, next) => {
  try {
    if (req.user.role !== "student") {
      return next();
    }

    const ownProfile = await Student.findOne({ userId: req.user._id }).select("_id");

    if (!ownProfile || ownProfile._id.toString() !== req.params.studentId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own records.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default verifyStudentSelf;
