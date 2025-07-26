export const isSupplier = (req, res, next) => {
  console.log("isSupplier middleware - req.user:", req.user);
  console.log("isSupplier middleware - user role:", req.user?.role);
  
  if (req.user?.role !== 'supplier') {
    console.log("Access denied - role mismatch. Expected: 'supplier', Got:", req.user?.role);
    return res.status(403).json({ message: "Access denied: Only suppliers can perform this action." });
  }
  
  console.log("isSupplier middleware - access granted");
  next();
};
