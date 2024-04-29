function isAdmin(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).send("You are not logged in.");
    }
    if (req.user.role !== 'admin') {
        console.log(`Access denied for user ${req.user.email}`); // Only for debugging; remove or secure in production
        return res.status(403).send("Access denied. You must be an admin to access this page.");
    }
    next();
}

module.exports = { isAdmin };
