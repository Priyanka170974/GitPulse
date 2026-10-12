/** Consistent success envelope for every REST endpoint. */
export function sendSuccess(res, { data, message, status = 200, meta }) {
  return res.status(status).json({
    success: true,
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
    ...(meta ? { meta } : {}),
  });
}

export default sendSuccess;