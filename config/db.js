const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI'); // to get the value from default.json

const connectDB = async () => {
    try {
        await mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false });
        console.log('MongoDB connected');
    } catch (error) {
        console.error(error.message);
        process.exit(1); // Exit process with failure
    }
}

module.exports = connectDB;
