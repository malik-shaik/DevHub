const express = require("express");
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Joi = require("@hapi/joi");
const Profile = require("../../models/Profile");
const router = express.Router();

//@route        GET api/profile/me
//@desc         Get current user's profile
//@access       Private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    ); //we have access to req.user.id from the jwt token(auth)
    if (!profile) {
      res.status(400).json({ msg: "There is no profile for this user" });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error...!");
  }
});

//@route        POST api/profile
//@desc         Create or Update user's profile
//@access       Private
const profileSchema = Joi.object({
  status: Joi.required(),
  skills: Joi.required(),
  company: Joi.optional(),
  website: Joi.optional(),
  location: Joi.optional(),
  bio: Joi.optional(),
  status: Joi.optional(),
  githubusername: Joi.optional(),
  skills: Joi.optional(),
  youtube: Joi.optional(),
  facebook: Joi.optional(),
  twitter: Joi.optional(),
  instagram: Joi.optional(),
  lingkedin: Joi.optional()
});
router.post("/", auth, async (req, res) => {
  const result = profileSchema.validate(req.body);
  if (result.error) {
    console.log(result.error.details[0].message);
    return res.status(400).json({ error: result.error.details[0].message });
  }

  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    lingkedin
  } = req.body;

  // Build profile object
  const profileFields = {};
  profileFields.user = req.user.id; //from the token
  if (company) profileFields.company = company;
  if (website) profileFields.website = website;
  if (location) profileFields.location = location;
  if (bio) profileFields.bio = bio;
  if (status) profileFields.status = status;
  if (githubusername) profileFields.githubusername = githubusername;
  if (skills)
    profileFields.skills = skills.split(",").map(skill => skill.trim());
  //Build social object
  profileFields.social = {};
  if (youtube) profileFields.social.youtube = youtube;
  if (twitter) profileFields.social.twitter = twitter;
  if (facebook) profileFields.social.facebook = facebook;
  if (lingkedin) profileFields.social.lingkedin = lingkedin;
  if (instagram) profileFields.social.instagram = instagram;

  try {
    let profile = await Profile.findOne({ user: req.user.id });
    //Updating profile if exist
    if (profile) {
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
      return res.json(profile);
    }
    // Creating new profile
    profile = new Profile(profileFields);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error..!");
  }
});

//@route        GET api/profile
//@desc         GET all profiles
//@access       Public
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error...!");
  }
});

//@route        GET api/profile/user/user_id
//@desc         GET profile by user id
//@access       Public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate("user", ["name", "avatar"]);
    //check profile exist
    if (!profile) return res.status(400).json({ msg: "Profile not found." });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId")
      return res.status(400).json({ msg: "Profile not found." });
    res.status(500).send("Server Error");
  }
});

//@route        DELETE api/profile
//@desc         DELETE profile user and posts
//@access       Private
router.delete("/", auth, async (req, res) => {
  try {
    await Profile.findOneAndRemove({ user: req.user.id }); //deleting profile
    await User.findOneAndRemove({ _id: req.user.id }); //deleting user
    res.json({ mgs: "User Deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error...!");
  }
});

//@route        PUT api/profile/experience
//@desc         Add profile experience
//@access       Private
const experienceSchema = Joi.object({
  title: Joi.required(),
  company: Joi.required(),
  location: Joi.optional(),
  from: Joi.required(),
  to: Joi.optional(),
  current: Joi.optional(),
  description: Joi.optional()
});
router.put("/experience", auth, async (req, res) => {
  const result = experienceSchema.validate();
  if (result.error) {
    console.log(result.error.details[0].message);
    return res.status(400).json({ error: result.error.details[0].message });
  }

  const { title, company, location, from, to, current, description } = req.body;
  const newExp = { title, company, location, from, to, current, description };

  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.experience.unshift(newExp);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error...!");
  }
});

//@route        DELET api/profile/experience/exp_id
//@desc         Delete profile experience
//@access       Private
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    // get the index of the exp to be removed
    const removeIndex = profile.experience
      .map(exp => exp.id)
      .indexOf(req.params.exp_id);
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route        PUT api/profile/education
//@desc         Add profile educaiton
//@access       Private
const educationSchema = Joi.object({
  school: Joi.required(),
  degree: Joi.required(),
  fieldofstudy: Joi.optional(),
  from: Joi.required(),
  to: Joi.optional(),
  current: Joi.optional(),
  description: Joi.optional()
});
router.put("/education", auth, async (req, res) => {
  const result = educationSchema.validate();
  if (result.error) {
    console.log(result.error.details[0].message);
    return res.status(400).json({ error: result.error.details[0].message });
  }
  const {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  } = req.body;
  const newEdu = {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  };
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.education.unshift(newEdu);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error...!");
  }
});

//@route        DELET api/profile/education/edu_id
//@desc         Delete profile education
//@access       Private
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    // get the index of the education to be removed
    const removeIndex = profile.education
      .map(edu => edu.id)
      .indexOf(req.params.edu_id);
    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
