const createError = (status, message) => {
        const err = new Error(message);
        err.status = status;
        return err;
};

function validate(schema, source = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) {
      /*return res.status(400).json({
        error: "Validation failed",
        details: error.details.map(d => d.message),
      });*/
	throw createError(400, "Input validation failed");
    }
    req[source] = value;
    next();
  };
}
module.exports = validate;
