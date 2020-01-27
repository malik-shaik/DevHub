const express = require("express");
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Joi = require("@hapi/joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

const router = express.Router();

// @route       GET api/auth
//@desc         Test route
//@access       Public
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // get the user without password
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route       Post api/auth
//@desc         login route
//@access       Private

const schema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string()
    .min(4)
    .required()
});

router.post("/", async (req, res) => {
  let result = schema.validate(req.body, { abortEarly: false });
  var errors = [];
  if (result.error) {
    result.error.details.forEach(detail => {
      errors.push({
        message: detail.message.replace(/['"]+/g, "")
      });
    });
    return res.status(400).json({ errors: errors });
  }

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      errors.push({ message: "Invalid credentials" });
      return res.status(400).json({ errors: errors });
      //   res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      errors.push({ message: "Invalid credentials" });
      return res.status(400).json({ errors: errors });
      //   res.status(400).json({ msg: "Invalid credentials" });
    }

    //Creating Json Web Tokent
    const payload = { user: { id: user.id } }; //mongoose converts the _id from DB to id
    jwt.sign(
      payload, // data
      config.get("jwtSecret"), // jwt secrete
      { expiresIn: 360000 }, //jwt expires in seconds
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    res.status(500).send("Server Error");
  }
});
module.exports = router;
