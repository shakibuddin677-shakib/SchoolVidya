// Yeh script SIRF EK BAAR chalana hai - purane deletions se bache "orphaned" records (jinke Student/Class ab exist hi nahi karte) ko dhoondh kar delete karta hai.
import "dotenv/config";
import mongoose from "mongoose";
import Student from "./models/student.model.js";
import Class from "./models/class.model.js";
import Section from "./models/section.model.js";
import Subject from "./models/subject.model.js";
import Attendance from "./models/attendance.model.js";
import Result from "./models/result.model.js";
import FeeStructure from "./models/feeStructure.model.js";
import FeePayment from "./models/feePayment.model.js";
import HomeworkSubmission from "./models/homeworkSubmission.model.js";
import BookIssue from "./models/bookIssue.model.js";
import Exam from "./models/exam.model.js";
import ExamSchedule from "./models/examSchedule.model.js";
import Timetable from "./models/timetable.model.js";

const run = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  console.log(" Connected to MongoDB\n");

  // Student se related orphaned records
  const validStudentIds = (await Student.find().select("_id")).map((s) => s._id.toString());

  const cleanByStudent = async (Model, name) => {
    const all = await Model.find().select("studentId");
    const orphanIds = all.filter((doc) => !validStudentIds.includes(doc.studentId?.toString())).map((d) => d._id);
    if (orphanIds.length > 0) {
      await Model.deleteMany({ _id: { $in: orphanIds } });
    }
    console.log(` ${name}: removed ${orphanIds.length} orphaned record(s)`);
  };

  await cleanByStudent(Attendance, "Attendance");
  await cleanByStudent(Result, "Result");
  await cleanByStudent(FeePayment, "FeePayment");
  await cleanByStudent(HomeworkSubmission, "HomeworkSubmission");
  await cleanByStudent(BookIssue, "BookIssue");

  // Class se related orphaned records
  const validClassIds = (await Class.find().select("_id")).map((c) => c._id.toString());

  const cleanByClass = async (Model, name) => {
    const all = await Model.find().select("classId");
    const orphanIds = all.filter((doc) => !validClassIds.includes(doc.classId?.toString())).map((d) => d._id);
    if (orphanIds.length > 0) {
      await Model.deleteMany({ _id: { $in: orphanIds } });
    }
    console.log(` ${name}: removed ${orphanIds.length} orphaned record(s)`);
    return orphanIds;
  };

  const orphanFeeStructureIds = await cleanByClass(FeeStructure, "FeeStructure");
  // In deleted FeeStructures se judi FeePayments bhi hatao (yehi wo records the jo negative "pending" amount bana rahe the)
  if (orphanFeeStructureIds.length > 0) {
    const paymentResult = await FeePayment.deleteMany({ feeStructureId: { $in: orphanFeeStructureIds } });
    console.log(` FeePayment (linked to deleted FeeStructures): removed ${paymentResult.deletedCount} record(s)`);
  }

  await cleanByClass(Subject, "Subject");

  const orphanSectionIds = (async () => {
    const all = await Section.find().select("classId");
    return all.filter((doc) => !validClassIds.includes(doc.classId?.toString())).map((d) => d._id);
  })();
  const sectionIdsToDelete = await orphanSectionIds;
  if (sectionIdsToDelete.length > 0) {
    await Timetable.deleteMany({ sectionId: { $in: sectionIdsToDelete } });
    await Section.deleteMany({ _id: { $in: sectionIdsToDelete } });
  }
  console.log(` Section: removed ${sectionIdsToDelete.length} orphaned record(s)`);

  const orphanExamIds = await cleanByClass(Exam, "Exam");
  if (orphanExamIds.length > 0) {
    const schedules = await ExamSchedule.find({ examId: { $in: orphanExamIds } }).select("_id");
    const scheduleIds = schedules.map((s) => s._id);
    await Result.deleteMany({ examScheduleId: { $in: scheduleIds } });
    await ExamSchedule.deleteMany({ examId: { $in: orphanExamIds } });
    console.log(` ExamSchedule + Result (linked to deleted Exams): cleaned up`);
  }

  console.log("\n Cleanup complete! Re-check your Reports page now.");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(" Cleanup failed:", err.message);
  process.exit(1);
});
