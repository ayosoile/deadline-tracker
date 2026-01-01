require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose')
const Deadline = require('./model/deadline.model.js');
const cors = require('cors');

//authentication for login and register
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./model/User.js");


//Middleware
const app = express()
app.use(express.json());

//Allows communication between backend and frontend
app.use(cors());

//Authentication middleware
function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
//LOGGING IN AND REGISTERING USERS
//register new user
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existing = await User.findOne({ username });

    if (existing)
      return res.status(400).json({ message: "User already exists" });

    //hashes password with 2^10 salt rounds
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashed
    });
    //User token valid for 1 day
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//login user
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials" });

    //User token valid for 1 day
    const token = jwt.sign(
      { userId: user._id, username: user.username},
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



//helper function to calculate days remaining/overdue for add and get requests dynamically
function computeDeadlineFields(deadline) {
  const daysRemaining = Math.ceil(
    (new Date(deadline.due_date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24) + 1
  );

  return {
    ...deadline,
    daysRemaining,
    overdue: daysRemaining <= 0
  };
}

//CRUD OPERATIONS FOR DEADLINES
//Retrieves all deadlines sorted from database, computes days remaining
app.get("/", auth, async (req, res) => {
  try {
    const deadlines = await Deadline.find({
      userId: req.userId
    });

    const result = deadlines.map(d =>
      computeDeadlineFields(d.toObject())
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Add a new deadline to database
app.post("/", auth, async (req, res) => {
  try {
    const deadline = await Deadline.create({
      ...req.body,
      userId: req.userId // Associate deadline with authenticated user
    });

    const result = computeDeadlineFields(
      deadline.toObject()
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


//Update deadline
app.put("/:id", auth, async (req, res) => {
  try {
    const deadline = await Deadline.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId }, 
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!deadline) {
      return res.status(404).json({ message: "Deadline not found" });
    }

    res.status(200).json(
      computeDeadlineFields(deadline.toObject())
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


//Delete deadline
app.delete("/:id", auth, async (req, res) => {
  try {
    const deadline = await Deadline.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId 
    });

    if (!deadline) {
      return res.status(404).json({ message: "Deadline not found" });
    }

    res.status(200).json({ message: "Successfully deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



//Connecting to database, encrypting password using environment variable
mongoose.connect(process.env.MONGO_URI)
.then(()=> {
    console.log('Database connected successfully');
    app.listen(5000, () => {
    console.log('Server is running on port 5000');
    });
})
.catch((err) => {
    console.log('Error connecting to Database:', err);
});
