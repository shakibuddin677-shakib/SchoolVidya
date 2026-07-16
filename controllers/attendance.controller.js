import Attendance from "../models/attendance.model.js";

// poori class ka attendance ek hi request mein le lete hain, har student ke liye alag API call ki zaroorat nahi
export const markAttendance = async (req, res) => {
  try {
    const { classId, sectionId, date, records } = req.body;

    if (!classId || !sectionId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "classId, sectionId, date aur records (array) required hain",
      });
    }

    // Har student ke liye ek "updateOne" operation banate hain, sabko ek array mein daal ke ek hi bulkWrite() mein bhej dete hain
    const bulkOps = records.map((record) => ({
      updateOne: {
        filter: { studentId: record.studentId, date }, // isko dhoondo
        update: {
          $set: {
            classId,
            sectionId,
            status: record.status,
            markedBy: req.user._id, // yeh humein auth.middleware se milta hai
          },
        },
        upsert: true, // na mile to naya bana do
      },
    }));

    const result = await Attendance.bulkWrite(bulkOps);

    return res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      data: {
        newlyCreated: result.upsertedCount,
        updated: result.modifiedCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attendance/section?sectionId=...&date=2024-07-04
export const getAttendanceBySection = async (req, res) => {
  try {
    const { sectionId, date } = req.query;

    if (!sectionId || !date) {
      return res.status(400).json({
        success: false,
        message: "sectionId aur date query mein zaroori hain",
      });
    }

    const attendance = await Attendance.find({ sectionId, date })
      .populate("studentId", "rollNo")
      .populate("markedBy", "name");

    return res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Student apna dashboard kholega to yeh use hoga - poori history + summary Optional: ?month=7&year=2026 se sirf ek specific mahine ka data mil sakta hai
export const getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;

    const filter = { studentId };

    // Agar month aur year diye hain, sirf usi mahine ki date-range filter karo
    if (month && year) {
      const startDate = new Date(year, month - 1, 1); // mahine ka pehla din
      const endDate = new Date(year, month, 0, 23, 59, 59); // mahine ka aakhri din
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(filter).sort({ date: -1 });

    // Simple counting - kitne present, kitne absent...
    const summary = { present: 0, absent: 0, late: 0, halfday: 0 };
    records.forEach((record) => {
      summary[record.status]++;
    });

    const totalDays = records.length;

    // "present" din poore count hote hain, "late" bhi poora din mana jata hai (school phir bhi aaya), aur "halfday" ko AADHA din count karte hain
    const presentEquivalent = summary.present + summary.late + summary.halfday * 0.5;
    const attendancePercentage =
      totalDays > 0 ? Number(((presentEquivalent / totalDays) * 100).toFixed(2)) : 0;

    return res.status(200).json({
      success: true,
      data: records,
      summary: {
        ...summary, // present, absent, late, halfday
        totalDays,
        attendancePercentage,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Agar Teacher ne galti se galat mark kar diya, isse fix karenge
export const updateAttendance = async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
