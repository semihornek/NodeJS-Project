/**
 * This method fetches the value of the cookie with the given HTTP request object and cookie key
 * @param {Object} req
 * @param {String} cookieName
 * @returns intended cookie value
 */
exports.getCookies = (req, cookieName) => {
  const cookiesArray = req.get("Cookie")?.split("; ");
  const cookies = {};
  cookiesArray?.forEach((cookieKeyValue) => {
    const [cookieKey, cookieValue] = cookieKeyValue.split("=");
    cookies[cookieKey] = cookieValue;
  });
  return cookies[cookieName];
};
