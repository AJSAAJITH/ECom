const products = require('../demo_data/products.json');
const Product = require('../model/productModel');
const dotenv = require('dotenv');
const connectDatabase = require('../config/database');

dotenv.config({path:'backend/config/config.env'});
connectDatabase();

const seedProducts = async()=>{
    try{
       await Product.deleteMany();
       console.log("Product Deleted");
       await Product.insertMany(products);
       console.log("Product Inserted");
    }catch(error){
        console.log(error);
    }
    process.exit();
}

seedProducts();