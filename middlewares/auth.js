const createError = (status, message) => {
	const err = new Error(message);
	err.status = status;
	return err;
};

module.exports = function requireAuth(req, res, next) {

	if (!req.session || !req.session.userId) {
		return next(createError(401, 'Authentication required'));
	}

	next();
};
