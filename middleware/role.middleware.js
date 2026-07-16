// isAuthenticated ke baad chalta hai, req.user ke role ko allowed roles se match karta hai
const allowRoles = (...roles) => {
  // "...roles" ka matlab hai jitne bhi arguments doge (jaise "admin", "teacher") sab ek array mein collect ho jayenge: ["admin", "teacher"]

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
