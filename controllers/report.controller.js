import mongoose from "mongoose";
import Student from "../models/student.model.js";
import Teacher from "../models/teacher.model.js";
import Class from "../models/class.model.js";
import Subject from "../models/subject.model.js";
import Attendance from "../models/attendance.model.js";
import FeePayment from "../models/feePayment.model.js";
import FeeStructure from "../models/feeStructure.model.js";
import Result from "../models/result.model.js";
import { ensureCurrentMonthTuitionFees } from "../utils/feeAutomation.js";

// ================== DASHBOARD STATS (Admin Dashboard ke top wale cards) ==================
export const getDashboardStats = async (req, res) => {
  try {
    // Promise.all - sab counts ek saath PARALLEL mein nikal lo, ek-ek karke nahi
    const [totalStudents, totalTeachers, totalClasses, totalSubjects] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Class.countDocuments(),
      Subject.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: { totalStudents, totalTeachers, totalClasses, totalSubjects },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== ATTENDANCE REPORT (class-wise %) ==================
// FEATURE: optional ?classId=... query param.
// - No classId ("Overall") -> every class, grouped (same as before).
// - classId given -> only that one class's attendance is aggregated,
//   so both the "by class" bar chart and the "overall %" card can reuse
//   this same endpoint for a single-class view.
export const getAttendanceReport = async (req, res) => {
  try {
    const { classId } = req.query;

    if (classId && !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: "Invalid classId" });
    }

    const pipeline = [];

    // Jab specific class chuni gayi ho, sabse pehle sirf usi class ke
    // records tak seemit kar do - baaki pipeline pehle jaisa hi rahega
    if (classId) {
      pipeline.push({ $match: { classId: new mongoose.Types.ObjectId(classId) } });
    }

    pipeline.push(
      // STAGE 1: $group - sab attendance records ko "classId" ke hisaab se group karo
      {
        $group: {
          _id: "$classId", // isi field ki value ke hisaab se alag-alag groups banenge
          totalRecords: { $sum: 1 }, // har record ke liye 1 jodo = total count
          presentCount: {
            // $cond: agar status "present" hai to 1 jodo, warna 0
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
          },
        },
      },
      // STAGE 2: $lookup - "populate" jaisa hi hai, bas aggregate mein iska yeh naam hai
      {
        $lookup: {
          from: "classes", // MongoDB collection ka naam hamesha lowercase + plural
          localField: "_id", // humare group ka "_id" hi asal mein classId hai
          foreignField: "_id",
          as: "classInfo", // result yahan ek ARRAY mein aayega
        },
      },
      // STAGE 3: $project - sirf jo fields chahiye wahi output karo,
      // aur percentage yahin calculate kar do
      {
        $project: {
          className: { $arrayElemAt: ["$classInfo.name", 0] }, // array ka pehla item nikalo
          totalRecords: 1,
          presentCount: 1,
          attendancePercentage: {
            $round: [
              { $multiply: [{ $divide: ["$presentCount", "$totalRecords"] }, 100] },
              2, // 2 decimal places tak round
            ],
          },
        },
      }
    );

    const report = await Attendance.aggregate(pipeline);

    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== FEE COLLECTION REPORT ==================
// FEATURE: optional ?classId=... query param.
// - No classId ("Overall") -> totals across every class (as before).
// - classId given -> totals only for that one class's fee structures
//   and the payments made against them.
export const getFeeCollectionReport = async (req, res) => {
  try {
    // Dashboard/report kholte hi turant check kar lo ki current month ka
    // Tuition Fee structure kisi class ka missing to nahi hai
    await ensureCurrentMonthTuitionFees();

    const { classId } = req.query;

    if (classId && !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: "Invalid classId" });
    }

    // BUG FIX (kept from earlier fix): FeeStructure is a per-CLASS "price
    // list" (e.g. "Class 5, Term 1, Tuition Fee, ₹5000") - it is shared by
    // every student in that class, it's NOT a per-student amount. So we
    // multiply each structure's amount by however many students are
    // actually enrolled in that class, instead of just summing prices once.
    const structureFilter = classId ? { classId } : {};

    const [feeStructures, studentCounts] = await Promise.all([
      FeeStructure.find(structureFilter),
      // "how many students are in each class" - if a classId filter is
      // active, only count students in that class
      Student.aggregate([
        ...(classId ? [{ $match: { classId: new mongoose.Types.ObjectId(classId) } }] : []),
        { $group: { _id: "$classId", count: { $sum: 1 } } },
      ]),
    ]);

    const studentCountByClass = new Map(
      studentCounts.map((entry) => [entry._id.toString(), entry.count])
    );

    const due = feeStructures.reduce((sum, structure) => {
      const studentsInClass = studentCountByClass.get(structure.classId.toString()) || 0;
      return sum + structure.amount * studentsInClass;
    }, 0);

    // Collected amount ko bhi sirf isi class ke fee structures tak seemit
    // karo - warna "class-wise" view mein doosri classes ka collection bhi
    // mix ho jayega
    const structureIds = feeStructures.map((s) => s._id);
    const totalCollectedResult = await FeePayment.aggregate([
      { $match: { feeStructureId: { $in: structureIds } } },
      { $group: { _id: null, totalCollected: { $sum: "$amountPaid" } } },
    ]);

    // Agar koi payment record hi nahi hai, aggregate KHAALI array [] deta hai -
    // isliye "?." (optional chaining) + "|| 0" use karke safe rehte hain
    const collected = totalCollectedResult[0]?.totalCollected || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalDue: due,
        totalCollected: collected,
        totalPending: due - collected,
        collectionPercentage: due > 0 ? Number(((collected / due) * 100).toFixed(2)) : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== BEST TEACHERS (ranked by their subjects' avg marks) ==================
// Teacher ke paas seedha "performance" nahi hota - hum unke padhaye hue
// subjects ke Result-average ko unke saath jodte hain, aur un averages ka
// weighted mean (student-count se weighted) nikaal ke rank karte hain.
export const getBestTeachers = async (req, res) => {
  try {
    // Step 1: har subject ka average marks + kitne students ne diya (weight ke liye)
    const subjectPerf = await Result.aggregate([
      {
        $lookup: {
          from: "examschedules",
          localField: "examScheduleId",
          foreignField: "_id",
          as: "schedule",
        },
      },
      { $unwind: "$schedule" },
      {
        $group: {
          _id: "$schedule.subjectId",
          averageMarks: { $avg: "$marksObtained" },
          totalStudents: { $sum: 1 },
        },
      },
    ]);

    const subjectPerfMap = new Map(subjectPerf.map((s) => [s._id.toString(), s]));

    // Step 2: har Teacher ke apne subjects ke averages ko combine karo
    const teachers = await Teacher.find()
      .populate("userId", "name")
      .select("userId qualification employeeId subjects");

    const ranked = teachers
      .map((t) => {
        const relevantSubjects = (t.subjects || [])
          .map((sId) => subjectPerfMap.get(sId.toString()))
          .filter(Boolean);

        if (relevantSubjects.length === 0) return null; // abhi tak koi result hi nahi hai

        const totalWeight = relevantSubjects.reduce((sum, s) => sum + s.totalStudents, 0);
        const weightedAverage =
          relevantSubjects.reduce((sum, s) => sum + s.averageMarks * s.totalStudents, 0) / totalWeight;

        return {
          teacherId: t._id,
          name: t.userId?.name,
          qualification: t.qualification,
          employeeId: t.employeeId,
          averageMarks: Math.round(weightedAverage * 100) / 100,
          subjectsGraded: relevantSubjects.length,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.averageMarks - a.averageMarks);

    return res.status(200).json({ success: true, data: ranked });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== STUDENT PROGRESS (per-student overall % ranking) ==================
// Har Result document ka percentage nikaal ke, studentId ke hisaab se average
// karta hai - "Best Performers" (section-wise) aur "Student Progress"
// (student-wise) dono widgets isi ek response se bante hain.
//
// FEATURE: optional ?sectionIds=id1,id2,id3 query param (comma-separated).
// - Diya gaya -> sirf un sections ke students (jaise ek Teacher ke apne sections)
// - Nahi diya -> poore school ke students (Admin/overall view)
export const getStudentProgress = async (req, res) => {
  try {
    const { sectionIds } = req.query;
    let sectionObjectIds = null;

    if (sectionIds) {
      const ids = sectionIds.split(",").map((id) => id.trim()).filter(Boolean);
      if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({ success: false, message: "Invalid sectionIds" });
      }
      sectionObjectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    }

    const pipeline = [
      // Result ke paas seedha maxMarks nahi hai - ExamSchedule join karke lao
      {
        $lookup: {
          from: "examschedules",
          localField: "examScheduleId",
          foreignField: "_id",
          as: "schedule",
        },
      },
      { $unwind: "$schedule" },
      // Har paper ka percentage nikaal ke studentId ke hisaab se average karo
      {
        $group: {
          _id: "$studentId",
          averagePercentage: {
            $avg: { $multiply: [{ $divide: ["$marksObtained", "$schedule.maxMarks"] }, 100] },
          },
          totalPapers: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
    ];

    // Sirf in sections ke students chahiye (Teacher apne hi sections dekhega)
    if (sectionObjectIds) {
      pipeline.push({ $match: { "student.sectionId": { $in: sectionObjectIds } } });
    }

    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "student.userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "classes",
          localField: "student.classId",
          foreignField: "_id",
          as: "classInfo",
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "student.sectionId",
          foreignField: "_id",
          as: "sectionInfo",
        },
      },
      {
        $project: {
          _id: 0,
          studentId: "$_id",
          name: "$user.name",
          rollNo: "$student.rollNo",
          classId: "$student.classId",
          sectionId: "$student.sectionId",
          className: { $arrayElemAt: ["$classInfo.name", 0] },
          sectionName: { $arrayElemAt: ["$sectionInfo.name", 0] },
          averagePercentage: { $round: ["$averagePercentage", 2] },
          totalPapers: 1,
        },
      },
      { $sort: { averagePercentage: -1 } }
    );

    const progress = await Result.aggregate(pipeline);

    return res.status(200).json({ success: true, data: progress });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// FEATURE: optional ?classId=... query param.
// - No classId ("Overall") -> subject averages across every class (as before).
// - classId given -> subject averages only for exams belonging to that class.
//   (Result doesn't store classId directly, so we trace
//    Result -> ExamSchedule -> Exam.classId to filter.)
//
// ALSO: har subject ke saath uski OWN class ka naam bhi return karte hain
// (className) - kyunki Subject model class-scoped hai (jaise "Mathematics"
// Class 5 ke liye aur "Mathematics" Class 8 ke liye do ALAG documents hain).
// Sirf subjectName dikhane se same-naam wale subjects duplicate jaise
// dikhte the - className isko disambiguate karta hai.
export const getExamPerformanceReport = async (req, res) => {
  try {
    const { classId } = req.query;

    if (classId && !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: "Invalid classId" });
    }

    const pipeline = [
      // Result ke paas seedha subjectId nahi hai - pehle ExamSchedule
      // join karna padega taaki subjectId mil sake
      {
        $lookup: {
          from: "examschedules",
          localField: "examScheduleId",
          foreignField: "_id",
          as: "schedule",
        },
      },
      // $lookup hamesha ARRAY deta hai, lekin yahan hume pata hai
      // ek Result ka EK hi schedule hoga - $unwind array ko "flatten"
      // karke seedha object bana deta hai
      { $unwind: "$schedule" },
    ];

    // classId filter ke liye ek aur $lookup zaroori hai - Exam mein hi
    // classId hota hai, ExamSchedule mein nahi
    if (classId) {
      pipeline.push(
        {
          $lookup: {
            from: "exams",
            localField: "schedule.examId",
            foreignField: "_id",
            as: "exam",
          },
        },
        { $unwind: "$exam" },
        { $match: { "exam.classId": new mongoose.Types.ObjectId(classId) } }
      );
    }

    pipeline.push(
      {
        $group: {
          _id: "$schedule.subjectId",
          averageMarks: { $avg: "$marksObtained" },
          highestMarks: { $max: "$marksObtained" },
          lowestMarks: { $min: "$marksObtained" },
          totalStudents: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "subjects",
          localField: "_id",
          foreignField: "_id",
          as: "subjectInfo",
        },
      },
      // subjectInfo ek array hai - flatten karo. preserveNullAndEmptyArrays:
      // agar subject baad mein delete ho gaya ho, tab bhi yeh row drop nahi
      // hogi (pehle jaisa $arrayElemAt tolerant behaviour hi rakha hai)
      { $unwind: { path: "$subjectInfo", preserveNullAndEmptyArrays: true } },
      // Subject ki apni class ka naam laane ke liye ek aur lookup -
      // subjectInfo.classId se "classes" collection join karo
      {
        $lookup: {
          from: "classes",
          localField: "subjectInfo.classId",
          foreignField: "_id",
          as: "classInfo",
        },
      },
      {
        $project: {
          subjectName: "$subjectInfo.name",
          className: { $arrayElemAt: ["$classInfo.name", 0] },
          averageMarks: { $round: ["$averageMarks", 2] },
          highestMarks: 1,
          lowestMarks: 1,
          totalStudents: 1,
        },
      }
    );

    const report = await Result.aggregate(pipeline);

    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
