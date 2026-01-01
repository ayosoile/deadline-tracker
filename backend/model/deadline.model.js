const mongoose = require('mongoose');


//Schema for each deadline entry
const DeadlineSchema = mongoose.Schema(
    {
        course: {
            type: String,
            required: [true, "Please enter course name"]
        },

        title: {
            type: String,
            required: [true, "Enter assignment title"]
        },

        type: {
            type: String,
            enum: ['assignment', 'exam', 'midterm'],
            required: [true, "Please select deadline type"]
        },

        due_date: {
            type: Date,
            required: [true, "Please enter due date"]
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
    }
);

const Deadline = mongoose.model('Deadline', DeadlineSchema);
module.exports = Deadline;