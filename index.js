require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose')
const Deadline = require('./model/deadline.model.js');


//Middleware
const app = express()
app.use(express.json());

app.get('/', (req,res) => {
    res.send("Hello World");
})


//Retrieves all deadlines sorted from database, computes days remaining
app.get('/deadlines', async (req,res) => {
    try{
        const deadlines = await Deadline.find({}).sort({due_date: 1});

        //calculates days remaining for due date
        const result = deadlines.map(d => {
            const daysRemaining = Math.ceil(
                (new Date(d.due_date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
            );
            return {
                _id: d._id,
                course: d.course,
                title: d.title,
                type: d.type,
                due_date: d.due_date,
                daysRemaining,
                overdue: daysRemaining < 0

            };
        });
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
})

//Add a new deadline to database
app.post('/deadlines', async (req,res) => {
    try{
        const deadline = await Deadline.create(req.body);
        res.status(201).json(deadline);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
})

//Update deadline
app.put('/deadlines/:id', async (req,res)=>{
    try{
        const {id} = req.params;
        const deadline = await Deadline.findByIdAndUpdate(id,req.body,
            {
                new: true, //displays updated deadline
                runValidators: true // enforce deadline schema rules
            }
    );

        if(!Deadline) {
            return res.status(404).json({message: "Deadline Not Found"});
        }
        res.status(200).json({deadline});
    } catch(error) {
        res.status(500).json({message: error.message});
    }
})

//Delete deadline
app.delete('/deadlines/:id', async (req,res)=>{
    try{
    const {id} = req.params;
    const deadline = await Deadline.findByIdAndDelete(id);

    if(!Deadline) {
        return res.status(404).json({message: "Deadline Not Found"});
    }
    res.status(200).json({message: "Successfully deleted"});

    } catch (error) {
        res.status(500).json({message: error.message});
    }
})


//Connecting to database, encrypting password using environment variable
mongoose.connect(process.env.MONGO_URI)
.then(()=> {
    console.log('Database connected successfully');
    app.listen(3000, () => {
    console.log('Server is running on port 3000');
    });
})
.catch((err) => {
    console.log('Error connecting to Database:', err);
});
