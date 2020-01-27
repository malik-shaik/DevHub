const express = require('express');
const router = express.Router();
const Joi = require('@hapi/joi');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../../models/User');

//validation
const schema = Joi.object({
    // name: Joi.string().min(3).required().error(new Error('Name must be min 3 charects')),//custom error message
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(4).required()
});

// @route       POST api/users
//@desc         Register user route
//@access       Public
router.post('/', async (req, res) => {
    const result = schema.validate(req.body, { abortEarly: false });
    var errors = [];
    if (result.error) {
        result.error.details.forEach(detail => {
            errors.push({
                message: detail.message.replace(/['"]+/g, '') // it removes the double qoutes in error message from joi
            });
        });
        return res.status(400).json({ errors: errors });
        // return res.status(400).json({ errors: result.error.message });
    }

    const { name, email, password } = req.body;
    try {
        //See if user already exist
        let user = await User.findOne({ email: email });
        if (user) {
            errors.push({ message: 'User already exist' });
            return res.status(400).json({ errors: errors });
        }

        // creating an avatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        // creating a new user
        user = new User({ name, email, password, avatar });

        //hashing password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        //Creating Json Web Tokent
        const payload = { user: { id: user.id } }; //mongoose converts the _id from DB to id 
        jwt.sign(
            payload,                    // data
            config.get('jwtSecret'),    // jwt secrete
            { expiresIn: 360000 },      //jwt expires in seconds
            (err, token) => {
                if (err) throw err;
                res.json({ token })
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});
module.exports = router;