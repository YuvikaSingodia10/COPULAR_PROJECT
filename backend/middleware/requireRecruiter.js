function requireRecruiter(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Recruiter or Admin privileges required.' });
  }
  next();
}

module.exports = requireRecruiter;
