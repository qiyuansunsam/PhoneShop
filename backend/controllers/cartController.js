const Phone = require('../models/phone');
const User = require('../models/user');
const Order = require('../models/order');
const Cart = require('../models/cart');



/**
 * @swagger
 * /cart:
 *   get:
 *     tags:
 *       - Cart
 *     summary: Get cart items for current user
 *     description: |
 *       Retrieves all cart items for the currently authenticated user.
 *       - Automatically removes products where the corresponding phone no longer exists
 *       - Returns both the modified cart and the valid phone items
 *     responses:
 *       200:
 *         description: Cart items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The cart get successful"
 *                 carts:
 *                   $ref: '#/components/schemas/Cart'
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Phone'
 *       404:
 *         description: No items found in cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There is no items in your cart"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There is a problem in your database"
 *
 * @swagger
 * components:
 *   schemas:
 *     Cart:
 *       type: object
 *       properties:
 *         customer:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "6805d028ce97b37323831eef"
 *               quantity:
 *                 type: number
 *                 example: 2
 *     Phone:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6805d028ce97b37323831eef"
 *         name:
 *           type: string
 *           example: "iPhone 13"
 *         price:
 *           type: number
 *           example: 999
 *         # Add other phone properties as needed
 */

// get Cart items
const getCartItems = async (req, res) => {
    try {
        const customer = req.session.user.id
        const carts = await Cart.findOne({customer: {$eq: customer}})
        if (carts === null || carts === undefined) {
            return res.status(404).json({
                message: "There is no cart found"
            })
        }
        if (carts.length === 0) {
            return res.status(404).json({
                message: "There is no items in your cart"
            })
        }

        else {
            let cartPhone = []
            for (let i = carts.products.length - 1; i >= 0; i--) {
                const product = carts.products[i];
                let phone = await Phone.findOne({ _id: product._id });
                if (phone && product.quantity > 0) {
                    cartPhone.push(phone)
                } else {
                    carts.products.splice(i, 1);
                    console.log(`Removed product with ID ${product._id} because the phone no longer exists or the quantity is less than 1`);
                }
            }
            await carts.save();

            return res.status(200).json({
                message: "The cart get successful",
                carts: carts,
                items: cartPhone,
            })
        }
    } catch (e) {
        console.log(e)
        return res.status(500).json({
            message: "There is a problem in your database"
        })
    }

}


/**
 * @swagger
 * /cart/item:
 *   post:
 *     tags:
 *       - Cart
 *     summary: Update cart item quantity
 *     description: |
 *       Updates the quantity of an item in the customer's cart.
 *       - Creates a new cart if one doesn't exist
 *       - Updates quantity if item exists in cart
 *       - Adds item to cart if not already present
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - quantity
 *             properties:
 *               itemId:
 *                 type: string
 *                 example: "6805d028ce97b37323831eef"
 *                 description: ID of the phone listing to update in cart
 *               quantity:
 *                 type: integer
 *                 example: 3
 *                 description: New quantity for the item
 *     responses:
 *       200:
 *         description: Cart updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The cart update successful."
 *       403:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The itemId or quantity is nothing"
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The item which is this item Id doesn't exist."
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

// update Cart Item
const updateCartItem = async (req, res) => {
    const {itemId, quantity} = req.body
    if (itemId === undefined || quantity === undefined) {
        return res.status(403).json({
            message: "The itemId or quantity is nothing"
        })
    }
    else {
        try{
            const customer = req.session.user.id
            let phone = await Phone.findOne({_id: {$eq: itemId}})
            let customerCart = await Cart.findOne({customer: {$eq: customer}})
            console.log(customerCart)
            if (phone === undefined) {
                return res.status(404).json({
                    message: "The item which is this item Id doesn't exist."
                })
            }
            if (customerCart === null) {
                await Cart.create({
                    customer: customer,
                    products: [
                        {
                            _id: phone._id,
                            quantity: quantity,
                        }
                    ]
                })
                return res.status(200).json({
                    message: "The cart update successful."
                })
            }
            else {

                for (let product of customerCart.products) {
                    if (product._id.toString() === phone._id.toString()) {
                        product.quantity = quantity
                        customerCart.save()
                        return res.status(200).json({
                            message: "The cart update successful."
                        })
                    }
                }
                customerCart.products.push({
                    _id: phone._id,
                    quantity: quantity
                })
                await customerCart.save()
                return res.status(200).json({
                    message: "The cart update successful."
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
}
module.exports = {
    getCartItems,
    updateCartItem
}