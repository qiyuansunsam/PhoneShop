const Phone = require('../models/phone');
const User = require('../models/user');
const Order = require('../models/order');
const multer = require('multer');
const fs = require('fs');
const path = require('path');


/**
 * @swagger
 * /phones/sold-out-soon:
 *   get:
 *     summary: Get phones that are about to sell out
 *     description: |
 *       Retrieves a list of phones that:
 *       - Have stock greater than 0
 *       - Are not disabled
 *       - Sorted by stock quantity (lowest first)
 *       - Limited to 5 results
 *     tags: [Phones]
 *     responses:
 *       200:
 *         description: Successfully retrieved phones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The sold out soon phone list get successful"
 *                 phonelist:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Phone'
 *       403:
 *         description: No qualifying phones found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There is no phone which is sold out soon"
 *       500:
 *         description: Database error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There is a problem from the database"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Phone:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         title:
 *           type: string
 *           example: "iPhone 13 Pro"
 *         brand:
 *           type: string
 *           example: "Apple"
 *         stock:
 *           type: number
 *           example: 3
 *         price:
 *           type: number
 *           example: 999.99
 *         disabled:
 *           type: boolean
 *           nullable: true
 *         reviews:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Review'
 *       example:
 *         _id: "507f1f77bcf86cd799439011"
 *         title: "iPhone 13 Pro"
 *         brand: "Apple"
 *         stock: 3
 *         price: 999.99
 *         disabled: null
 *         reviews: []
 *
 *     Review:
 *       type: object
 *       properties:
 *         reviewer:
 *           type: string
 *           example: "507f1f77bcf86cd799439022"
 *         rating:
 *           type: number
 *           example: 5
 *         comment:
 *           type: string
 *           example: "Great phone!"
 *         hidden:
 *           type: boolean
 *           nullable: true
 */
// get sold out soon phones
const getSoldOutSoonPhones = async (req, res) => {
    try {
        const phones = await Phone.find({
            stock: {$gt: 0},
            disabled: {$exists: false}
        }).sort({stock: 1}).limit(5)
        console.log(phones)
        if(phones.length === 0) {
            return res.status(403).json({
                message: 'There is no phone which is sold out soon'
            })
        }
        else {
            return res.status(200).json({
                message: 'The sold out soon phone list get successful',
                phonelist: phones
            })
        }

    }
    catch (e) {
        return res.status(500).json({
            message: 'There is a problem from the database'
        })
    }
}

/**
 * @swagger
 * /phones/best-sellers:
 *   get:
 *     summary: Get best selling phones
 *     description: |
 *       Retrieves a list of best selling phones based on:
 *       - Must not be disabled
 *       - Must have more than 2 reviews
 *       - Sorted by average rating (highest first)
 *       - Limited to 5 results
 *     tags: [Phones]
 *     responses:
 *       200:
 *         description: Successfully retrieved best sellers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Get the best sellers successful"
 *                 bestSellers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BestSellerPhone'
 *       403:
 *         description: No best sellers found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There is no best seller"
 *       500:
 *         description: Database query error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There is a problem for database when it run query"
 *                 error:
 *                   type: object
 *                   example: {}
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     BestSellerPhone:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         title:
 *           type: string
 *           example: "iPhone 13 Pro"
 *         brand:
 *           type: string
 *           example: "Apple"
 *         price:
 *           type: number
 *           example: 999.99
 *         stock:
 *           type: number
 *           example: 10
 *         numberReviews:
 *           type: integer
 *           example: 5
 *           description: Count of reviews
 *         avgRating:
 *           type: number
 *           example: 4.8
 *           description: Average rating (0-5)
 *         reviews:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Review'
 *       example:
 *         _id: "507f1f77bcf86cd799439011"
 *         title: "iPhone 13 Pro"
 *         brand: "Apple"
 *         price: 999.99
 *         stock: 10
 *         numberReviews: 5
 *         avgRating: 4.8
 *         reviews: []
 *
 *     Review:
 *       type: object
 *       properties:
 *         reviewer:
 *           type: string
 *           example: "507f1f77bcf86cd799439022"
 *         rating:
 *           type: number
 *           example: 5
 *         comment:
 *           type: string
 *           example: "Excellent product!"
 */

// get best sellers
const getBestSellers = async (req, res) => {
    try {
        const bestSellers = await Phone.aggregate([
            {
                $match :{
                    disabled: {$exists: false}

                }
            },
            {
                $addFields: {
                    numberReviews: {$size: "$reviews.rating"},
                    avgRating: {$avg: "$reviews.rating"},
                }
            },
            {
                $match: {
                    numberReviews: {$gt: 2}
                }
            },
            {
                $sort: {
                    avgRating: -1,
                }
            },
            {
                $limit: 5,

            }

        ])
        if (bestSellers.length !== 0) {
            console.log("best sellers:", bestSellers)
            return res.status(200).json({
                message: "Get the best sellers successful",
                bestSellers: bestSellers
            })
        }
        else {
            return res.status(403).json({
                message: "There is no best seller"
            })
        }

    }
    catch (e) {
        console.log(e)
        return res.status(500).json({
            message: "There is a problem for database when it run query",
            error: e,
        })
    }
}


/**
 * @swagger
 * /phones/search:
 *   get:
 *     summary: Search phones by title
 *     description: |
 *       Search for phones containing the specified string in their title
 *       - Performs case-insensitive search
 *       - Returns empty array if no matches found
 *     tags: [Phones]
 *     parameters:
 *       - in: query
 *         name: queryString
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term to match in phone titles
 *         example: "iphone"
 *     responses:
 *       200:
 *         description: Successful search
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Get the search items successful"
 *                 phonelist:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Phone'
 *       403:
 *         description: No matching phones found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There is no item contains the search String."
 *       500:
 *         description: Database error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There is a error for your database"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Phone:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         title:
 *           type: string
 *           example: "iPhone 13 Pro"
 *         brand:
 *           type: string
 *           example: "Apple"
 *         price:
 *           type: number
 *           example: 999.99
 *         stock:
 *           type: number
 *           example: 10
 *         disabled:
 *           type: boolean
 *           nullable: true
 *       example:
 *         _id: "507f1f77bcf86cd799439011"
 *         title: "iPhone 13 Pro"
 *         brand: "Apple"
 *         price: 999.99
 *         stock: 10
 *         disabled: null
 */

const searchItem = async (req, res) => {
    const queryString = req.query.queryString
    console.log("query String:", queryString)
    try {
        const phones = await Phone.find({
            title : {$regex: queryString, $options: "i"}
        })
        if (phones.length === 0) {
            return res.status(403).json({
                message: "There is no item contains the search String."
            })
        }
        else {
            return res.status(200).json({
                message: "Get the search items successful",
                phonelist: phones,
            })
        }
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({
            message: 'There is a error for your database'
        })
    }
}




/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Add a new review to a phone product
 *     description: |
 *       Posts a new review for a phone product with the following validations:
 *       - Requires reviewData in request body
 *       - Validates all required review fields (productId, reviewer, rating, comment)
 *       - Returns specific error messages for each validation failure
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewData
 *             properties:
 *               reviewData:
 *                 type: object
 *                 required:
 *                   - _id
 *                   - reviewer
 *                   - rating
 *                   - comment
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID of the phone being reviewed
 *                     example: "507f1f77bcf86cd799439011"
 *                   reviewer:
 *                     type: string
 *                     description: ID or name of the reviewer
 *                     example: "user123"
 *                   rating:
 *                     type: number
 *                     description: Rating value (typically 1-5)
 *                     example: 5
 *                   comment:
 *                     type: string
 *                     description: Review comment text
 *                     example: "Great phone with excellent camera quality"
 *             example:
 *               reviewData:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 reviewer: "user123"
 *                 rating: 5
 *                 comment: "Excellent product"
 *     responses:
 *       200:
 *         description: Review added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The review add successful"
 *       403:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "The productId is null"
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "The reviewer data is null"
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "The rating data is null"
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "The comment data is null"
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "The reviewData is empty."
 *       500:
 *         description: Database error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There is a problem in your database"
 *                 error:
 *                   type: object
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         reviewer:
 *           type: string
 *         rating:
 *           type: number
 *         comment:
 *           type: string
 *       example:
 *         reviewer: "user123"
 *         rating: 5
 *         comment: "Great product"
 */

// post Review
const postReview = async (req, res) => {
    console.log("postReview body data", req.body)
    const {reviewData} = req.body
    if (reviewData !== null) {
        const productId = reviewData._id
        const reviewer = reviewData.reviewer
        const rating = reviewData.rating
        const comment = reviewData.comment
        if (productId === null) {
            console.log("The productId is null")
            return res.status(403).json({
                message: "The productId is null"
            })
        }
        if (reviewer == null) {
            console.log("The reviewer data is null")
            return res.status(403).json({
                message: "The reviewer data is null"
            })
        }
        if (rating === null) {
            console.log("The rating is null")
            return res.status(403).json({
                message: "The rating data is null"
            })
        }
        if (comment === null) {
            console.log("The comment data is null")
            return res.status(403).json({
                message: "The comment data is null"
            })
        }
        try{
            const phone = await Phone.findOne({_id :{$eq: productId}})
            const review_information = {
                reviewer: reviewer,
                rating: rating,
                comment: comment,
            }
            console.log("review information",review_information)
            phone.reviews.push(review_information)
            await phone.save()
            return res.status(200).json({
                message: "The review add successful"
            })
        }
        catch (e) {
            console.log(e)
            return res.status(500).json({
                message: "There is a problem in your database",
                error: e
            })
        }

    }
    else {
        return res.status(403).json({
            message: 'The reviewData is empty.'
        })
    }
}


/**
 * @swagger
 * /reviews/getUserReview:
 *   get:
 *     tags:
 *       - Reviews
 *     summary: Get all reviews by current user
 *     description: Retrieves all reviews submitted by the currently authenticated user across all phones
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Get the reviews successfully"
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/reviewResponseObject'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There is a problem in your database."
 *
 * @swagger
 * components:
 *   schemas:
 *     reviewResponseObject:
 *       type: object
 *       properties:
 *         phoneId:
 *           type: string
 *           example: "phoneid0312565"
 *         phoneTitle:
 *           type: string
 *           example: "Iphone 6"
 *         reviewer:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         rating:
 *           type: number
 *           example: 4.5
 *         comment:
 *           type: string
 *           example: "Great phone with excellent camera quality"
 *         # Add other review properties as needed
 */
//get Review By user id
const getReviewByUserId = async (req, res) => {
    let allUserReviews = []
    let user = req.session.user.id
    try {
        const phones = await Phone.find({})
                for (const phone of phones) {
            for (const originalReview of phone.reviews) {
                
                if (originalReview.reviewer === user) {
                    
                    const reviewResponseObject = originalReview.toObject ? originalReview.toObject() : { ...originalReview };

                    reviewResponseObject.phoneId = phone._id.toString();
                    reviewResponseObject.phoneTitle = phone.title;

                    allUserReviews.push(
                        reviewResponseObject
                    );
                }
            }
        }
        return res.status(200).json({
            message: "Get the reviews successfully",
            reviews: allUserReviews
        })
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({
            message: "There is a problem in your database."
        })
    }
}

/**
 * @swagger
 * /reviews/{phoneId}/visibility:
 *   patch:
 *     summary: Toggle visibility of reviews by a specific reviewer
 *     description: |
 *       Updates the hidden status of all reviews from a specific reviewer for a phone.
 *       - Requires phoneId in URL
 *       - Requires isHidden and reviewer in request body
 *       - Returns 403 if any required field is null
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: phoneId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the phone containing the reviews
 *         example: "6805d028ce97b37323831ed6"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isHidden
 *               - reviewer
 *             properties:
 *               isHidden:
 *                 type: boolean
 *                 description: New visibility status to apply
 *                 example: true
 *               reviewer:
 *                 type: string
 *                 description: Name/ID of the reviewer whose reviews should be updated
 *                 example: "user123"
 *             example:
 *               isHidden: true
 *               reviewer: "user123"
 *     responses:
 *       200:
 *         description: Visibility updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The review change hidden status successful"
 *       403:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "The phoneId is null"
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "The isHidden is null"
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "The reviewer is null"
 *       500:
 *         description: Database error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There is a problem in database"
 *                 error:
 *                   type: object
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ReviewVisibilityUpdate:
 *       type: object
 *       properties:
 *         isHidden:
 *           type: boolean
 *           description: Visibility status (true = hidden)
 *         reviewer:
 *           type: string
 *           description: Reviewer identifier
 *       required:
 *         - isHidden
 *         - reviewer
 *       example:
 *         isHidden: true
 *         reviewer: "user123"
 */

// Toggle Review Visibility
const toggleReviewVisibility = async (req, res) => {
    console.log(req.body, req.params)
    const {phoneId} = req.params
    const {isHidden, reviewer} = req.body
    console.log("phoneId:", phoneId)
    console.log("isHidden:", isHidden)
    if (phoneId === null) {
        console.log("The phoneId is null")
        return res.status(403).json({
            message: "The phoneId is null"
        })
    }
    if (isHidden === null) {
        console.log("The Hidden is null")
        return res.status(403).json({
            message: "The isHidden is null"
        })
    }

    if (reviewer === null) {
        console.log("The reviewer is null")
        return res.status(403).json({
            message: "The reviewer is null"
        })
    }
    try {
        const phone = await Phone.findOne({_id:{$eq: phoneId}})
        let reviews = phone.reviews
        for (let review of reviews) {
            if (review.reviewer === reviewer) {
                review.hidden = isHidden
            }
        }
        phone.save()
        return res.status(200).json({
            message: "The review change hidden status successful"
        })
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({
            message: "There is a problem in database",
            error: e,
        })
    }

}



/**
 * @swagger
 * /profiles/listings:
 *   get:
 *     tags:
 *       - Listings
 *     summary: Get all phone listings
 *     description: Retrieve a list of all phone listings from the database
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successfully retrieved phone listings
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Get the phonelists successful"
 *             phonelists:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "507f1f77bcf86cd799439011"
 *                   title:
 *                     type: string
 *                     example: "iPhone 13 Pro"
 *                   brand:
 *                     type: string
 *                     example: "Apple"
 *                   image:
 *                     type: string
 *                     example: "iphone13.jpg"
 *                   stock:
 *                     type: number
 *                     example: 10
 *                   seller:
 *                     type: string
 *                     example: "507f1f77bcf86cd799439012"
 *                   price:
 *                     type: number
 *                     example: 999.99
 *                   reviews:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: []
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Database error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "There is a problem for your database"
 */
//get user listing
const getAllListings = async (req, res) => {
    try {
        const user_id = req.session.user.id
        const phones = await Phone.find({seller : {$eq: user_id}})
        return res.status(200).json({
            message: "Get the phonelists successful",
            phonelists: phones
        })
    }
    catch (e) {
        return res.status(500).json({
            message: "There is a problem for your database"
        })
    }
}




/**
 * @swagger
 * /profiles/listings/addListing:
 *   post:
 *     tags:
 *       - Listings
 *     summary: Add a new phone listing with image
 *     description: Create a new phone listing with image upload (multipart/form-data)
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: formData
 *         name: listingData
 *         type: string
 *         required: true
 *         description: JSON string containing listing details
 *         example: >
 *           {
 *             "title": "iPhone 13 Pro",
 *             "brand": "Apple",
 *             "stock": 10,
 *             "seller": "5f5237a4c1beb1523fa3da02",
 *             "price": 999.99,
 *             "image": "test_phone.jpg"
 *           }
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 *         description: The phone image file
 *     responses:
 *       200:
 *         description: Phone listing created successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "The new phone list create successful."
 *       403:
 *         description: Validation error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               enum:
 *                 - "There is no content for your listing Data"
 *                 - "The title is empty"
 *                 - "The brand is empty"
 *                 - "The image is empty"
 *                 - "The stock is empty"
 *                 - "The seller is empty"
 *                 - "The price is empty"
 *                 - "There is no user has this user id"
 *       500:
 *         description: Server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "There is a problem in your database"
 */
// add listing
const addListing = async (req, res) => {
    let {listingData} = req.body
    listingData = JSON.parse(listingData)
    if (listingData !== undefined) {
        const title = listingData.title
        const brand = listingData.brand
        const image = listingData.image
        const stock = listingData.stock
        const seller = req.session.user.id
        const price = listingData.price
        if (title === undefined) {
            return res.status(403).json({
                message: "The title is empty"
            })
        }
        if (brand === undefined) {
            return res.status(403).json({
                message: "The brand is empty"
            })
        }
        if (image === undefined) {
            return res.status(403).json({
                message: "The image is empty"
            })
        }
        if (stock === undefined) {
            return res.status(403).json({
                message: "The stock is empty"
            })
        }
        if (seller === undefined) {
            return res.status(403).json({
                message: "The seller is empty"
            })
        }
        if (price === undefined) {
            return res.status(403).json({
                message: "The price is empty"
            })
        }
        try {
            const user = await User.findOne({_id: {$eq: seller}})
            if (user === undefined) {
                return  res.status(403).json({
                    message: "There is no user has this user id"
                })
            }
            await Phone.create({
                title: title,
                brand: brand,
                image: image,
                stock: stock,
                seller: seller,
                price: price,
            })
            return res.status(200).json({
                message: "The new phone list create successful."
            })
        }
        catch (e) {
            console.log(e)
            return res.status(500).json({
                message: "There is a problem in your database"
            })
        }
    }
    else {
        return res.status(403).json({
            message: "There is no content for your listing Data"
        })
    }
}


/**
 * @swagger
 * /profiles/listings/{listingId}:
 *   put:
 *     tags:
 *       - Listings
 *     summary: Update a phone listing
 *     description: Update an existing phone listing with optional image upload
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the listing to update
 *         example: "6805d028ce97b37323831ed6"
 *       - in: formData
 *         name: listingData
 *         type: string
 *         required: true
 *         description: JSON string containing fields to update
 *         example: >
 *           {
 *             "title": "iPhone 13 Pro",
 *             "brand": "Apple",
 *             "stock": 10,
 *             "seller": "5f5237a4c1beb1523fa3da02",
 *             "price": 999.99,
 *             "image": "test_phone2.jpg",
 *             "reviews": []
 *           }
 *       - in: formData
 *         name: image
 *         type: file
 *         required: false
 *         description: New image file for the listing (optional)
 *     responses:
 *       200:
 *         description: Listing updated successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "The phone listing has updated successful"
 *       403:
 *         description: Validation error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               enum:
 *                 - "The listing Id or listing Data is nothing"
 *                 - "There is no phonelisting which is this listing id"
 *       500:
 *         description: Server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "There is a problem for your database."
 */
// update listing
const updateListing = async (req, res) => {
    let {listingId} = req.params
    let {listingData} = req.body
    console.log("listingId", listingId)
    console.log("listingData", listingData)
    if (listingId !== undefined && listingData !== undefined) {
        try {
            let phone = await Phone.findOne({_id: {$eq: listingId}})
            if (phone !== undefined){
                if (listingData.title) {
                    phone.title = listingData.title
                }
                if (listingData.brand) {
                    phone.brand = listingData.brand
                }
                if (listingData.image) {
                    phone.image = listingData.image
                }
                if (listingData.stock) {
                    phone.stock = listingData.stock
                }
                if (listingData.seller) {
                    phone.seller = listingData.seller
                }
                if (listingData.price) {
                    phone.price = listingData.price
                }
                if (listingData.reviews) {
                    phone.reviews = listingData.reviews
                }
                phone.save()
                return res.status(200).json({
                    message: "The phone listing has updated successful"
                })
            }
            else {
                return res.status(403).json({
                    message: "There is no phonelisting which is this listing id"
                })
            }
        }
        catch (e) {
            console.log(e)
            return res.status(500).json({
                message: "There is a problem for your database."
            })
        }
    }
    else {
        return res.status(403).json({
            message: "The listing Id or listing Data is nothing"
        })
    }
}


/**
 * @swagger
 * /profiles/listings/{listingId}/status:
 *   patch:
 *     tags:
 *       - Listings
 *     summary: Toggle listing status (enable/disable)
 *     description: Toggles the disabled status of a phone listing
 *     parameters:
 *       - name: listingId
 *         in: path
 *         required: true
 *         description: ID of the listing to toggle
 *         schema:
 *           type: string
 *           example: "6805d028ce97b37323831ed6"
 *     responses:
 *       200:
 *         description: Status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The phone update list status successful"
 *                 disabled:
 *                   type: boolean
 *                   example: true
 *       403:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The listingId is nothing"
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There is a problem for your database"
 */
// toggle listing status
const toggleListingStatus = async (req, res) => {
    const {listingId} = req.params
    console.log(listingId)
    if (listingId !== undefined) {
        try {
            let phone = await Phone.findOne({_id: {$eq: listingId}})
            console.log(phone)
            if (phone) {
                if (phone.disabled === undefined) {
                    phone.disabled = true
                    phone.save()
                    return res.status(200).json({
                        message: "The phone update list status successful",
                        disabled: true
                    })
                }
                else {
                    phone.disabled = undefined
                    phone.save()
                    return res.status(200).json({
                        message: "The phone update list status successful",
                        disabled: false
                    })
                }
            }
        }
        catch (e) {
            console.log(e)
            return res.status(500).json({
                message: "There is a problem for your database"
            })
        }
    }
    else {
        return res.status(403).json({
            message: "The listingId is nothing"
        })
    }
}


/**
 * @swagger
 * /profiles/listings/{listingId}:
 *   delete:
 *     tags:
 *       - Listings
 *     summary: Delete a phone listing and its associated image
 *     description: Deletes a phone listing from the database and removes its image file from public/images if it exists
 *     parameters:
 *       - name: listingId
 *         in: path
 *         required: true
 *         description: ID of the listing to delete
 *         schema:
 *           type: string
 *           example: "6819f848d3edf8c3e40e1e3f"
 *     responses:
 *       200:
 *         description: Listing deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The phone list delete successful"
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Phone listing not found"
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "The listingId is nothing"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There is a problem for your database."
 */

// delete Listing
const  deleteListing = async (req, res) => {
    const {listingId} = req.params
    console.log(listingId)
    if (listingId !== undefined) {
        try {
            let phone = await Phone.findOne({_id: {$eq: listingId}})
            if (!phone) {
                return res.status(404).json({
                    message: "Phone listing not found"
                });
            }

            if (phone.image) {
                const imagePath = path.join(__dirname, '../public/images', phone.image);

                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log(`Deleted image file: ${imagePath}`);
                }
            }
            await Phone.deleteOne({_id: {$eq: listingId}})
            return res.status(200).json({
                message: "The phone list delete successful"
            })
        }
        catch (e) {
            return res.status(500).json({
                message: "There is a problem for your database."
            })
        }
    }
    else {
        return res.status(404).json({
            message: "The listingId is nothing"
        })
    }
}


    module.exports = {
        getSoldOutSoonPhones,
        getBestSellers,
        searchItem,
        postReview,
        toggleReviewVisibility,
        getAllListings,
        addListing,
        updateListing,
        toggleListingStatus,
        deleteListing,
        getReviewByUserId
}