const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
    {
        username: {
            type:String,
            required: [true, "Please enter Username"],
            unique: true
        },

        password : {
            type: String,
            required: [true, "Please enter password"]
        }
    }
)

module.exports = mongoose.model("User", userSchema);
