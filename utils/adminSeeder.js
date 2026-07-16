import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

// Server start hote hi ek Admin account automatically ban jaye, taaki humein Postman se manually admin create na karna pade
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (adminExists) {
      console.log(" Admin already exists");
      return;
    }

    // Password kabhi bhi plain text mein DB mein save nahi karte - hamesha hash karo
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    await User.create({
      name: "Admin",
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
    });

    console.log(" Admin Created");
  } catch (error) {
    console.log(" Admin Seeder Error:", error.message);
  }
};

export default seedAdmin;
