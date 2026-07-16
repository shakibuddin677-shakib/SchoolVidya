// yeh sirf HTML string banata hai, actual email bhejna sendEmail.js ka kaam hai
const credentialsEmailTemplate = ({ name, email, password, role, loginUrl }) => `
  <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 480px; margin: 0 auto; background: #f5f7f6;">
    <div style="background: #10231D; padding: 20px; border-radius: 10px 10px 0 0;">
      <h2 style="color: #F2B705; margin: 0;">Welcome to SchoolVidya, ${name}!</h2>
    </div>
    <div style="background: #ffffff; padding: 24px; border-radius: 0 0 10px 10px;">
      <p style="color: #333;">Your <strong>${role}</strong> account has been created by the school administrator. Here are your login details:</p>

      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 10px; background: #f5f7f6; font-weight: bold; color: #10231D;">Email</td>
          <td style="padding: 10px; background: #f5f7f6;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; color: #10231D;">Temporary Password</td>
          <td style="padding: 10px; font-family: monospace; font-size: 15px;">${password}</td>
        </tr>
      </table>

      <a href="${loginUrl}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #F2B705;
        color: #10231D;
        text-decoration: none;
        font-weight: bold;
        border-radius: 6px;
        margin-top: 8px;
      ">Login Now</a>

      <p style="margin-top: 20px; font-size: 13px; color: #888;">
        For your security, please change this password after your first login.
      </p>
    </div>
  </div>
`;

export default credentialsEmailTemplate;
