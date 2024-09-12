const sendToken = (user, statusCode, res) => {

    //Creating JWT Token
    const token = user.getJwtToken();

    //setting Cookies
    const option ={
        expires:new Date(Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000), // 7 days for milli seconds
        httpOnly:true
    }

    res.status(statusCode)
    .cookie('token', token, option)
    .json({
        success: true,
        token,
        user
    })


}

module.exports = sendToken;