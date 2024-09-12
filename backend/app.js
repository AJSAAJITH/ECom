const express = require('express');
const app = express();
const errorMiddleware = require('./middlewares/error');
const cookiParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({path:path.join(__dirname,"config/config.env")});
// const cors = require('cors'); 

app.use(express.json());
app.use(cookiParser());

// // Enable CORS for all routes
// app.use(cors({ 
//     origin: 'http://localhost:3000',  // Frontend URL (adjust based on your setup)
//     credentials: true  // Allow cookies to be sent with requests
// }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const products = require('./routes/product');
const user = require('./routes/auth');
const order = require('./routes/order');
const payment = require('./routes/payment');

// backend routes
app.use('/api/v1', products);
app.use('/api/v1', user);
app.use('/api/v1', order);
app.use('/api/v1', payment);

// build config
if(process.env.NODE_ENV === "production"){
    // frontend build access 
    app.use(express.static(path.join(__dirname,'../frontend/build')));
    // frontend request handling
    app.get('*', (req, res)=>{
        // index.html have main.js like 
        res.sendFile(path.resolve(__dirname,'../frontend/build/index.html'));
    })
}

app.use(errorMiddleware);

module.exports = app;