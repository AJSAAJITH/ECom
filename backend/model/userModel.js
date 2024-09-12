const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, "Please Enter Name"]
    },
    email:{
        type:String,
        required:[true, "Plaese Enter Email"],
        unique: true,
        validate:[validator.isEmail, "Please Enter validEmail address"]
    },
    password: {
        type: String,
        required: [true, 'Please enter password'],
        maxlength: [6, 'Password cannot exceed 6 characters'],
        select: false
    },
    avatar: {
        type: String,
        // required:true
    },
    role :{
        type: String,
        default: 'user'
    },
    resetPasswordToken: String,
    resetPasswordTokenExpire: Date,
    createdAt :{
        type: Date,
        default: Date.now
    }
})

userSchema.pre('save', async function(next) {
   if(!this.isModified('password')){
    next();
   } 
    this.password = await bcrypt.hash(this.password, 10)
})

// genarate tokan
userSchema.methods.getJwtToken = function(){

    return jwt.sign({id:this.id}, process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_TIME
    })
}

// 
userSchema.methods.isValidPassword = async function(enteredPassword){
    return  bcrypt.compare(enteredPassword, this.password)
}


// getRest Token
userSchema.methods.getResetToken = function(){
    //Genarate Token
    const token = crypto.randomBytes(20).toString('hex');

    //Genarate Hash and set to resetPasswordToken
    this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    // Set resetPasswordToken Expire time
    this.resetPasswordTokenExpire = Date.now() + 30 * 60 * 1000;

    return token;
}


const model = mongoose.model('User',userSchema);
module.exports = model;