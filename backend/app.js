const mongoose = require('mongoose');
const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('blablablaaaa');
})

mongoose.connect(process.env.MONGO_URI, {

})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.listen(5000, '0.0.0.0', () => {
    console.log('Server running on port 5000');
});