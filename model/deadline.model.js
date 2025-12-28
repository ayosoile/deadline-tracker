const mongoose = require('mongoose');

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
        }
    }
)

const Deadline = mongoose.model('Deadline', DeadlineSchema);
module.exports = Deadline;