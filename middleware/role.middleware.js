// Yeh "Floor Guard" hai - sirf tab chalta hai jab isAuthenticated
// PEHLE chal chuka ho (kyunki isko req.user chahiye)
//
// Yeh ek "middleware factory" hai - iska matlab yeh function khud
// middleware nahi hai, yeh ek middleware BANATA hai based on jo roles
// tum ise dete ho
//
// Use kaise karte hain:
//   router.post("/students", isAuthenticated, allowRoles("admin"), createStudent);
//   router.get("/attendance", isAuthenticated, allowRoles("admin", "teacher"), getAttendance);
const allowRoles = (...roles) => {
  // "...roles" ka matlab hai jitne bhi arguments doge (jaise "admin", "teacher")
  // sab ek array mein collect ho jayenge: ["admin", "teacher"]

  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user?.role}' is not allowed here.`,
      });
    }

    next(); // role match ho gaya, aage jao
  };
};

export default allowRoles;
