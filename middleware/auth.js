const jwt = require("jsonwebtoken");
const config = require("config");

const auth = (req, res, next) => {
  // get token from header
  const token = req.header("x-auth-token");
  //check if not token
  if (!token)
    return res.status(401).json({ msg: "No token, Authorisation denied" });
  // Verify token
  try {
    const decode = jwt.verify(token, config.get("jwtSecret"));
    req.user = decode.user; // assingning user._id from jwt to req.user
    next(); // send control to next middleware
  } catch (err) {
    res.status(401).json({ msg: "Token not valid" });
  }
};

module.exports = auth;
