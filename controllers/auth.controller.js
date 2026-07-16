import User from "../models/user.model.js";
import Student from "../models/student.model.js";
import Teacher from "../models/teacher.model.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

// login aur checkAuth response mein hi Student/Teacher profile bhej dete hain, taaki student ko alag se maangna na pade
const getProfileForUser = async (user) => {
  if (user.role === "student") {
    return Student.findOne({ userId: user._id })
      .populate("classId", "name academicYear")
      .populate({ path: "sectionId", select: "name classTeacherId", populate: { path: "classTeacherId", select: "name" } });
  }
  if (user.role === "teacher") {
    return Teacher.findOne({ userId: user._id }).populate({
      path: "subjects",
      select: "name classId",
      populate: { path: "classId", select: "name" },
    });
  }
  return null;
};

// login
export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    email = email.trim().toLowerCase();

    // password field select: false hai, isliye query mein explicitly +password add karna padta hai
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

const cookieOptions = {
      httpOnly: true, // JS se cookie access nahi ho sakti - XSS se bachav
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 din
    };

    res.cookie("token", token, cookieOptions);

    const profile = await getProfileForUser(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        profile,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// website reload hone par frontend yeh check karta hai ki login abhi bhi valid hai ya nahi
export const checkAuth = async (req, res) => {
  const profile = await getProfileForUser(req.user);
  return res.status(200).json({
    success: true,
    user: { ...req.user.toObject(), profile },
  });
};

// logout
export const logoutUser = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      expires: new Date(0), // cookie ko turant expire kar do
    });

    return res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Logout Error:", error.message);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
};

// forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });

    // security: email exist na ho tab bhi same generic response bhejte hain, warna attacker registered emails guess kar sakta hai
    if (user) {
      // Plain token generate karo (email mein yehi bhejenge)
      const resetToken = crypto.randomBytes(20).toString("hex");

      // DB mein plain token save NAHI karte - hash karke save karte hain (agar DB leak ho jaye to attacker reset link use na kar paaye)
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minute valid
      await user.save();

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested to reset your password.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="
            display: inline-block;
            padding: 12px 20px;
            background-color: #4f46e5;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 10px;
          ">Reset Password</a>
          <p style="margin-top: 20px;">This link will expire in 15 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `;

      // pehle "HTMLAllCollection" key bheji ja rahi thi jo sendEmail.js expect hi nahi karta tha - ab dono jagah "html" naam consistent hai
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request",
        html,
      });
    }

    // User mile ya na mile - hamesha yahi generic message (enumeration se bachne ke liye)
    res.status(200).json({
      success: true,
      message: "If an account exists for this email, a password reset link has been sent",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// reset password
export const resetPassword = async (req, res) => {
  try {
    // pehle "const token = req.params" likha tha - yeh poora object { token: "abc123" } le raha tha, string nahi.
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // expire time abhi bhi future mein ho
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = "";
    user.resetPasswordExpire = undefined;
    await user.save();

    // pehle "success: 'Password reset successfull'" tha - success hamesha boolean hona chahiye, message string mein jana chahiye
    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
