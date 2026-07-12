import nodemailer from "nodemailer";

const sendEmail = async ({ email, subject, html }) => {
  try {
    console.log("USING HOST:", process.env.BREVO_HOST, "| USER:", process.env.BREVO_USER);

    const port = Number(process.env.BREVO_PORT);
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_HOST,
      port,
      secure: port === 465, // sirf port 465 par true, 587/2525 par false
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
      connectionTimeout: 10000, // 10 sec - jaldi fail ho jaye, response atka na rahe
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