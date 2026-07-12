import Result from "../models/result.model.js";
import ExamSchedule from "../models/examSchedule.model.js";
import Teacher from "../models/teacher.model.js";
import Exam from "../models/exam.model.js";
import Student from "../models/student.model.js";

// ================== ENTER RESULTS (BULK) ==================
// Attendance jaisa hi pattern - ek Subject ke paper ke liye
// SAARE students ke marks ek hi request mein
//
// Body: {
//   examScheduleId,
//   marks: [ { studentId: "...", marksObtained: 85 }, { studentId: "...", marksObtained: 42 } ]
// }
export const enterResults = async (req, res) => {
  try {
    const { examScheduleId, marks } = req.body;

    if (!examScheduleId || !Array.isArray(marks) || marks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "examScheduleId aur marks (array) required hain",
      });
    }

    const schedule = await ExamSchedule.findById(examScheduleId);
    if (!schedule) {
      return res.status(404).json({ success: false, message: "Exam schedule not found" });
    }

    // Admin har subject ke marks de sakta hai, lekin Teacher SIRF apne
    // assigned subjects ke marks hi de sakta hai - warna koi bhi teacher
    // kisi bhi dusre subject ke (jo unko assign hi nahi hua) marks change kar sakta tha
    if (req.user.role === "teacher") {
      const teacherProfile = await Teacher.findOne({ userId: req.user._id });
      const teachesThisSubject = teacherProfile?.subjects?.some(
        (subjectId) => subjectId.toString() === schedule.subjectId.toString()
      );

      if (!teachesThisSubject) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to teach this subject, so you cannot enter marks for it",
        });
      }
    }

    // NOTE: yahan hum bulkWrite() NAHI use kar rahe (jaisa Attendance mein kiya tha) -
    // kyunki hume har Result document pe apna "pre-save hook" chalvana hai
    // (grade calculate karne wala), aur bulkWrite mongoose hooks ko SKIP kar deta hai.
    // Isliye yahan Promise.all() + individual save() use karenge - thoda slower,
    // lekin hooks properly chalte hain
    const results = await Promise.all(
      marks.map(async (entry) => {
        // findOneAndUpdate se pehle dhoondo, agar nahi mila to naya document banao
        let result = await Result.findOne({
          studentId: entry.studentId,
          examScheduleId,
        });

        if (result) {
          result.marksObtained = entry.marksObtained;
        } else {
          result = new Result({
            studentId: entry.studentId,
            examScheduleId,
            marksObtained: entry.marksObtained,
          });
        }

        await result.save(); // yahi line pre-save hook ko trigger karti hai
        return result;
      })
    );

    return res.status(200).json({
      success: true,
      message: "Results saved successfully",
      data: results,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== GET CLASS/SECTION RANKING (ek exam ke liye) ==================
// Result "Release" hone ke baad har section ke andar students ko unke
// TOTAL percentage (us exam ke saare papers milaakar) ke hisaab se
// rank karta hai. Example: GET /api/results/ranking/:examId?sectionId=...
export const getClassRanking = async (req, res) => {
  try {
    const { examId } = req.params;
    const { sectionId } = req.query;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    // Ranking sirf tab dikhti hai jab Admin ne is exam ke results
    // "Release" kar diye ho - warna abhi marks final hi nahi hain
    if (!exam.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Results for this exam have not been released yet",
      });
    }

    // Student apni khud ki section ki hi ranking dekh sakta hai - query
    // param se koi aur sectionId pass kare to bhi ignore karke apni
    // section force karo (privacy: doosri section ki ranking na dikhe)
    let effectiveSectionId = sectionId;
    if (req.user.role === "student") {
      const ownProfile = await Student.findOne({ userId: req.user._id }).select("sectionId");
      effectiveSectionId = ownProfile?.sectionId?.toString();
    }

    // Is exam ke saare papers (subjects) + unke maxMarks
    const schedules = await ExamSchedule.find({ examId }).select("maxMarks");
    const scheduleIds = schedules.map((s) => s._id);
    const maxMarksMap = new Map(schedules.map((s) => [s._id.toString(), s.maxMarks]));

    const results = await Result.find({ examScheduleId: { $in: scheduleIds } }).populate({
      path: "studentId",
      select: "rollNo sectionId userId",
      populate: { path: "userId", select: "name" },
    });

    // Har student ke saare papers ke marks jodo (total obtained / total max)
    const byStudent = new Map();
    results.forEach((r) => {
      const student = r.studentId;
      if (!student) return; // deleted student ka orphan result ho sakta hai
      if (effectiveSectionId && student.sectionId?.toString() !== effectiveSectionId) return;

      const key = student._id.toString();
      if (!byStudent.has(key)) {
        byStudent.set(key, {
          studentId: student._id,
          name: student.userId?.name,
          rollNo: student.rollNo,
          sectionId: student.sectionId,
          totalObtained: 0,
          totalMax: 0,
        });
      }
      const entry = byStudent.get(key);
      entry.totalObtained += r.marksObtained;
      entry.totalMax += maxMarksMap.get(r.examScheduleId.toString()) || 0;
    });

    const list = Array.from(byStudent.values())
      .map((e) => ({
        ...e,
        percentage: e.totalMax ? Math.round((e.totalObtained / e.totalMax) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Competition-style ranking (1, 2, 2, 4, ...) - barabar percentage
    // wale students ek hi rank share karte hain
    let rank = 0;
    list.forEach((item, idx) => {
      if (idx === 0 || item.percentage !== list[idx - 1].percentage) {
        rank = idx + 1;
      }
      item.rank = rank;
    });

    return res.status(200).json({
      success: true,
      data: list,
      meta: { examId, examName: exam.name, sectionId: effectiveSectionId || null },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== GET RESULTS BY EXAM SCHEDULE (ek paper ke sab results) ==================
export const getResultsBySchedule = async (req, res) => {
  try {
    const { examScheduleId } = req.params;

    const results = await Result.find({ examScheduleId }).populate("studentId", "rollNo");

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== GET RESULTS BY STUDENT (report card jaisa) ==================
export const getResultsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const results = await Result.find({ studentId }).populate({
      path: "examScheduleId",
      select: "date maxMarks examId subjectId",
      populate: [
        // "isPublished" bhi select karna zaroori hai - isi se decide hoga
        // ki Student ko yeh result dikhana hai ya nahi.
        // "classId" -> "academicYear" nested populate isliye add kiya -
        // Exam ke paas apna "academicYear" field nahi hai, yeh sirf
        // Class model mein hota hai, isliye Exam.classId se hi milega
        // (frontend "Academic Year" filter ke liye zaroori hai)
        { path: "examId", select: "name term isPublished classId startDate endDate", populate: { path: "classId", select: "academicYear" } },
        { path: "subjectId", select: "name code" },
      ],
    });

    // Student khud apna result maang raha hai to SIRF un exams ke marks
    // dikhao jinhe Admin ne "Release Results" se explicitly publish
    // kiya hai - chahe Teacher ne saare subjects ke marks kabhi ke
    // enter kar diye ho. Admin/Teacher (jaise kisi Student ka profile
    // review karte waqt) ko hamesha SAB results dikhte hain, taaki wo
    // release karne se pehle data verify kar sakein.
    const visibleResults =
      req.user.role === "student"
        ? results.filter((r) => r.examScheduleId?.examId?.isPublished)
        : results;

    return res.status(200).json({ success: true, data: visibleResults });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
