export const isSupplier = (req, res, next) => {
  if (req.user?.role !== 'supplier') {
    return res.status(403).json({ message: "Access denied: Only suppliers can perform this action." });
  }
  next();
};
