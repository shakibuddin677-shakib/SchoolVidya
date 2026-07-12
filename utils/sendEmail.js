import nodemailer from "nodemailer";

// Generic email bhejne wala function - forgot password, notices, fee reminders
// sabke liye reuse hoga
const sendEmail = async ({ email, subject, html }) => {
  try {
    console.log("USING HOST:", process.env.BREVO_HOST, "| USER:", process.env.BREVO_USER);
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_HOST,
      port: Number(process.env.BREVO_PORT),
      secure: false, // true only if port is 465
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};

export default sendEmail;