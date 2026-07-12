// "dotenv/config" - yeh special import hai jo file ke top pe hote hi
// TURANT .env file load kar deta hai, bina "dotenv.config()" alag se
// likhe. Chunki yeh sabse PEHLI import hai, .env variables baaki
// saari imports (jo cloudinary.js jaisi files ko chalati hain) se
// PEHLE hi set ho jaate hain
import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import connectDB from "./config/db.js";
import seedAdmin from "./utils/adminSeeder.js";
import authRoutes from "./routes/auth.routes.js";
import classRoutes from "./routes/class.routes.js";
import sectionRoutes from "./routes/section.routes.js";
import userRoutes from "./routes/user.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import examRoutes from "./routes/exam.routes.js";
import examScheduleRoutes from "./routes/examSchedule.routes.js";
import resultRoutes from "./routes/result.routes.js";
import feeStructureRoutes from "./routes/feeStructure.routes.js";
import feePaymentRoutes from "./routes/feePayment.routes.js";
import timetableRoutes from "./routes/timetable.routes.js";
import bookRoutes from "./routes/book.routes.js";
import bookIssueRoutes from "./routes/bookIssue.routes.js";
import noticeRoutes from "./routes/notice.routes.js";
import reportRoutes from "./routes/report.routes.js";
import homeworkRoutes from "./routes/homework.routes.js";
import homeworkSubmissionRoutes from "./routes/homeworkSubmission.routes.js";
import parentRoutes from "./routes/parent.routes.js";

const app = express();

// DB Connection
connectDB();

// Seed Admin (server start hote hi admin account ban jayega agar exist nahi karta)
seedAdmin();

// NOTE: monthly Tuition Fee auto-generation ("ensureCurrentMonthTuitionFees")
// yahan background job/interval se NAHI chalaya jaata - simplicity ke liye
// isko sirf un 3 controllers mein "on-visit" call kiya gaya hai jaha Admin
// practically hamesha jaata hai jab Fee section kholta hai:
// getFeeStructures, getFeeCollectionReport, getFeeStatusByStudent
// (dekho utils/feeAutomation.js ke comments mein detail)

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));

// Health check route - deploy hone ke baad check karne ke liye ki server zinda hai
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running...",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/exam-schedules", examScheduleRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/fee-structures", feeStructureRoutes);
app.use("/api/fee-payments", feePaymentRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/book-issues", bookIssueRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/homework", homeworkRoutes);
app.use("/api/homework-submissions", homeworkSubmissionRoutes);
app.use("/api/parents", parentRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
});
