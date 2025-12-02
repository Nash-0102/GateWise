module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You Must be first Logged in");
        return res.redirect("/");
    }
    next();
}


module.exports.isSecretary = (req, res, next) => {
    if (req.user && req.user.role === "Secretary"

    ) {
        return next();
    }
    req.flash("error", "Access denied");
    res.redirect("/");
}