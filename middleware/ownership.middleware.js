import Student from "../models/student.model.js";

// BUG FIX: several "student self-service" routes (attendance/student/:studentId,
// results/student/:studentId, fee-payments/student/:studentId,
// book-issues/student/:studentId, homework-submissions/student/:studentId) allow
// role "student" through allowRoles(), but never checked that the :studentId in
// the URL actually belongs to the logged-in user. Any student could read ANY
// other student's attendance, grades, fee payments, book issues, or homework
// submissions just by changing the id in the URL (classic IDOR).
//
// This middleware plugs that hole:
// - Admin / teacher: unrestricted (they're allowed to view any student).
// - Student: we look up THEIR OWN Student profile from req.user._id (never
//   trust an id coming from the client) and compare it to the :studentId
//   param. If they don't match, the request is rejected with 403.
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
