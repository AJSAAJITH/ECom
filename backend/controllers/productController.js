const Product = require('../model/productModel');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncError = require('../middlewares/catchAsyncError');
const ApiFeatures = require('../utils/apiFeatures');

// Get Products - /api/v1/products/
exports.getProducts = catchAsyncError(
    async (req, res, next) => {
        const resPerPage = 4;
        // const apiFeatures = new ApiFeatures(Product.find(), req.query).search().filter().paginate(resPerPage);

        let buildQuery = () => {

            return new ApiFeatures(Product.find(), req.query).search().filter()

        }

        const filteredProductsCount = await buildQuery().query.countDocuments({})
        const totalProductCount = await Product.countDocuments({});
        const products = await buildQuery().paginate(resPerPage).query;
        let productsCount = totalProductCount;

        // time deleay tesing
        // await new Promise(resolve => setTimeout(resolve, 3000))
        // return next(new ErrorHandler('This is tesing error', 401));


        if (filteredProductsCount !== totalProductCount) {
            productsCount = filteredProductsCount;
        }

        res.status(200).json({
            success: true,
            count: productsCount,
            resPerPage,
            products
            // message: "This route will show all the products in the database"
        });
    });

//(Admin) Create Product - /api/v1/admin/product/new
exports.newProduct = catchAsyncError(async (req, res, next) => {

    // upload images
    let images = []

    // for develpment
    let BASE_URL = process.env.BACKEND_URL;

    if (process.env.NODE_ENV === "production") {
        BASE_URL = `${req.protocol}://${get('host')}`
    }

    if (req.files.length > 0) {
        req.files.forEach(file => {
            let url = `${BASE_URL}/uploads/product/${file.originalname}`;
            images.push({ image: url })
        })
    }

    req.body.images = images;

    req.body.user = req.user.id;
    const product = await Product.create(req.body);
    res.status(201).json({
        success: true,
        product
    });
});

// Get Single Product- /api/v1/product/66bccfdb91ce17285f01ce2c
exports.getSingleProduct = catchAsyncError(
    async (req, res, next) => {
        const product = await Product.findById(req.params.id).populate('reviews.user', 'name email');

        if (!product) {
            return next(new ErrorHandler('Product not found', 400));

            // res.status(404).json({
            //     success: false,
            //     message:"Product not found"  
            // })
        }

        res.status(201).json({
            success: true,
            product
        })


    })

// Update Product- /api/v1/product/66bccfdb91ce17285f01ce29
exports.updateProduct = catchAsyncError(
    async (req, res, next) => {

        let product = await Product.findById(req.params.id);

        // uploading images
        let images = []

        // if images not cleared we keep exsist images
        if (req.body.imagesCleared === 'false') {
            images = product.images;
        }

        // for develpment
        let BASE_URL = process.env.BACKEND_URL;

        if (process.env.NODE_ENV === "production") {
            BASE_URL = `${req.protocol}://${get('host')}`
        }

        if (req.files.length > 0) {
            req.files.forEach(file => {
                let url = `${BASE_URL}/uploads/product/${file.originalname}`;
                images.push({ image: url })
            })
        }

        req.body.images = images;



        if (!product) {
            res.status(404).json({
                success: false,
                message: "Product not found"

            })
        } else {
            product = await Product.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
            })
            res.status(201).json({
                success: true,
                product
            })
        }
    });

// Admin Delete Product - /api/v1/admin/product/66bccfdb91ce17285f01ce29
exports.deleteProduct = catchAsyncError(
    async (req, res, next) => {
        let product = await Product.findById(req.params.id);
        if (!product) {
            res.status(404).json({
                success: false,
                message: "Product not found"

            })
        } else {
            await product.deleteOne()
            res.status(200).json({
                success: true,
                message: "Product Deleted"
            })
        }
    })


// Create Review - /api/v1/review
exports.createReview = catchAsyncError(
    async (req, res, next) => {

        const { productId, rating, comment } = req.body;

        // data
        const review = {
            user: req.user.id,
            rating,
            comment
        }

        const product = await Product.findById(productId);

        // finding user review exists
        const isReviewed = product.reviews.find(review => {
            return review.user.toString() == req.user.id.toString();
        })

        if (isReviewed) {
            // updating the review
            product.reviews.forEach(review => {
                if (review.user.toString() == req.user.id.toString()) {
                    // update exsist review
                    review.comment = comment,
                        review.rating = rating
                }
            })

        } else {
            // creating the review not review with this user (is a Array)
            product.reviews.push(review);
            product.numOfReviews = product.reviews.length;
        }

        // find the avarage of the product reviews
        product.ratings = product.reviews.reduce((acc, review) => {
            return review.rating + acc;
        }, 0) / product.reviews.length;

        product.ratings = isNaN(product.ratings) ? 0 : product.ratings;

        await product.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true
        })

    })


// Get Reviews - /api/v1/admin/reviews
exports.getReviews = catchAsyncError(async (req, res, next) => {

    const product = await Product.findById(req.query.id).populate('reviews.user', 'name email');

    res.status(200).json({
        success: true,
        reviews: product.reviews
    })

})

// Delete Review - /api/v1/review?id=reviewId&productId=productid
exports.deleteReview = catchAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);

    // filtering the reviews which does match the deleting review id
    const reviews = product.reviews.filter(review => {
        return review._id.toString() !== req.query.id.toString();
    })
    // number of reviews update
    const numOfReviews = reviews.length;

    // find the avg with the filtered reviews
    let ratings = reviews.reduce((acc, review) => {
        return review.rating + acc;
    }, 0) / reviews.length;

    ratings = isNaN(ratings) ? 0 : ratings;

    //save the product document
    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        numOfReviews,
        ratings
    })
    res.status(200).json({
        success: true
    })
})


// Get admin Products - api/v1/admin/products
exports.getAdminProducts = catchAsyncError(async (req, res, next) => {
    const products = await Product.find();
    res.status(200).send({
        success: true,
        products
    })
})

