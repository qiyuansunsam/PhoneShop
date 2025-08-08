const Phone = require('../models/phone');
const User = require('../models/user');
const Order = require('../models/order');
const Cart = require('../models/cart');

/**
 * @swagger
 * /orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Process a new phone order
 *     description: Creates a new order, reduces phone stock quantities, and returns order confirmation.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - _id
 *                     - number
 *                   properties:
 *                     _id:
 *                       type: string
 *                       pattern: '^[0-9a-fA-F]{24}$'
 *                       example: "6805d028ce97b37323831ed6"
 *                     number:
 *                       type: integer
 *                       minimum: 1
 *                       example: 2
 *             example:
 *               items:
 *                 - _id: "6805d028ce97b37323831ed6"
 *                   number: 2
 *                 - _id: "6805d028ce97b37323831ed7"
 *                   number: 1
 *     responses:
 *       '200':
 *         description: Order processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The items order process successful."
 *       '403':
 *         description: Forbidden (insufficient stock or item not found)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The items: 6805d028ce97b37323831ed6 stock is 0 or the stock less than the user required number"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There are some problems in the database"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 *     security:
 *       - sessionAuth: []
 */
// process order
const processOrder = async (req, res) => {
    console.log("test")
    const {items} = req.body
    console.log(items)
    let products = []
    let totalNumber = 0
    let totalPrice = 0
    if (items.length !== 0) {
        for (let item of items) {

            try {
                let phone  = await Phone.find({_id : {$eq: item._id}})
                if (phone.length !== 0) {
                    if (phone.stock === 0 || phone.stock < item.number) {
                        return res.status(403).json({
                            message: `The items: ${item._id} stock is 0 or the stock less than the user required number, you cannot buy it please try it again`
                        })
                    }
                    else {
                        phone  = phone[0]
                        console.log(phone)
                        phone.stock = phone.stock - item.number
                        let product = {
                            _id: phone._id,
                            number: item.number,
                            price: phone.price,
                        }
                        products.push(product)
                        totalNumber = totalNumber + item.number
                        totalPrice = totalPrice + item.number * phone.price
                        phone.save()

                    }
                }
                else {
                    return res.status(403).json({
                        message: `There is no items which is ${item._id}, please check it and try it again`
                    })
                }
            }
            catch (e) {
                console.log(e)
                return res.status(500).json({
                    message: 'There are some problems in the database',
                    error: e
                })
            }

        }
        try {
            await Order.create({
                buyer: req.session.user.id,
                totalNumber: totalNumber,
                totalPrice: totalPrice,
                products: products,
            })
            await Cart.deleteOne({customer :{$eq: req.session.user.id}})
        }
        catch (e) {
            console.log(e)
            return res.status(200).json({
                message: "There is a problem for your database",
                error: e
            })

        }
        return res.status(200).json({
            message: "The items order process successful."
        })
    }
}

module.exports = {
    processOrder
}