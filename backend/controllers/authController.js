const { json } = require('body-parser');
const catchAsyncError = require('../middlewares/catchAsyncError');
const User = require('../model/userModel');
const sendEmail = require('../utils/email');
const ErrorHandler = require('../utils/errorHandler');
const sendToken = require('../utils/jwt');
const crypto = require('crypto');
const { get } = require('http');

// Register -/api/v1/register
exports.registerUser = catchAsyncError(async (req, res, next) => {
    const { name, email, password } = req.body;

    let avatar;

    // for develpment
    let BASE_URL = process.env.BACKEND_URL;

    if (process.env.NODE_ENV === "production") {
        BASE_URL = `${req.protocol}://${get('host')}`
    }


    if (req.file) {
        avatar = `${BASE_URL}/uploads/user/${req.file.originalname}`  // image url path
    }

    const user = await User.create({
        name,
        email,
        password,
        avatar
    });

    sendToken(user, 201, res);

    //    const token = user.getJwtToken();
    //    res.status(201).json({
    //     success: true,
    //     user,
    //     token
    //    })
});

//Login - /api/v1/login
exports.loginUser = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body

    if (!email || !password) {
        return next(new ErrorHandler('Please enter email & password', 400))
    }

    //finding the user database
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new ErrorHandler('Invalid email or password', 401))
    }

    if (!await user.isValidPassword(password)) {
        return next(new ErrorHandler('Invalid email or password', 401))
    }

    sendToken(user, 201, res);
}
)

//Logout - /api/v1/logout
exports.logoutUser = (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })
        .status(200)
        .json({
            success: true,
            message: "Logout Succesfull"
        })
}

// Froget Password - /api/v1/password/frogot
exports.forgetPassword = catchAsyncError(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new ErrorHandler('User not found with this email', 401));
    }

    // reset oparation sucess here
    const resetToken = user.getResetToken();
    await user.save({ validateBeforeSave: false });

        // for develpment
        let BASE_URL = process.env.FRONTEND_URL;

        if(process.env.NODE_ENV === "production"){
            BASE_URL = `${req.protocol}://${get('host')}`
        }


    // Create Reset URL
    // const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`;
    const resetUrl = `${BASE_URL}/password/reset/${resetToken}`;

    // Email message
    const message = `Your password reset URL is as follows:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`;

    try {
        await sendEmail({
            email: user.email,
            subject: "ECom-cart Soft Password Recovery",
            message,
        });

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email}`,
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler(error.message, 500));
    }
});

// reset password - /api/v1/password/reset/:token
exports.resetPassword = catchAsyncError(async (req, res, next) => {

    // genarate to hash
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordTokenExpire: {
            $gt: Date.now()
        }
    })

    if (!user) {
        return next(new ErrorHandler('Password Reset Token is invalid or Expired', 401));
    }

    // check password !== confirm password
    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler('Password does not match', 401));
    }

    // password is ture
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // set token in a cookie
    sendToken(user, 201, res)
})

// Get User Profile -/api/v1/myprofile
exports.getUserProfile = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        user
    })
});

// Change password - /api/v1/password/change
exports.changePassword = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    // check old password
    if (!await user.isValidPassword(req.body.oldPassword)) {
        return next(new ErrorHandler('Old Password is incorrect', 401));
    }

    //assigning new password
    user.password = req.body.password;
    await user.save();
    res.status(200).json({
        success: true
    })

});

// Update Profile - /api/v1/update
exports.updateProfile = catchAsyncError(async (req, res, next) => {
    let newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    let avatar;

    // for develpment
    let BASE_URL = process.env.BACKEND_URL;

    if (process.env.NODE_ENV === "production") {
        BASE_URL = `${req.protocol}://${get('host')}`
    }

    if (req.file) {
        avatar = `${BASE_URL}/uploads/user/${req.file.originalname}`  // image url path
        newUserData = { ...newUserData, avatar }
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true
    })
    res.status(200).json({
        success: true,
        user
    })

})

// Admin: Get Users - /api/v1/admin/users
exports.getAllUsers = catchAsyncError(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
});

//Admin: Get Specific User - /api/v1/admin/user/:id
exports.getUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler('User not foud with this ID', 401));
    }
    res.status(200).json({
        success: true,
        user
    })
})

//Admin : Update User -/api/v1/admin/user/:id
exports.updateUser = catchAsyncError(async (req, res, next) => {

    const userId = req.params.id;
    const { name, email, role } = req.body;

    const user = await User.findById(userId);

    // check if the email has changed 
    if (email && email !== user.email) {
        // If the email has changed, check if the new email is already used by another user
        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser._id.toString() !== userId) {
            return res.status(400).json({
                success: false,
                message: "Email already in use"
            });
        }
    }

    // update User Data
    const newUserData = {
        name: name || user.name,  // If name is not provided, keep the old value
        email: email || user.email,  // If email is not provided, keep the old value
        role: role || user.role     // If role is not provided, keep the old value
    }

    const updatedUser = await User.findByIdAndUpdate(userId, newUserData, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        user: updatedUser
    });

})

//Admin: Delete User - /api/v1/admin/user/:id
exports.deleteUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler('User not foud with this ID', 401));
    }

    await user.deleteOne();
    res.status(200).json({
        success: true
    })
})