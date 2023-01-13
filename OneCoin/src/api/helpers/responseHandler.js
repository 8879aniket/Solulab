class AppError extends Error {
	constructor(message, statusCode) {
		super(message);
		this.statusCode = statusCode;
		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
		this.isOperational = true;

		Error.captureStackTrace(this, this.constructor);
	}
}

const handleResponse = ({
	res,
	statusCode = 200,
	msg = 'Success',
	data = {},
}) => {
	res.status(statusCode).send({ status: 'success', msg, data });
};

export { handleResponse, AppError };
