const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto')
const mongoose = require("mongoose");



/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         firstname:
 *           type: string
 *         lastname:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *     LoginRequest:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *     ResetRequest:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *     ResetPassword:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *         new_password:
 *           type: string
 */
// email configuration
const emailConfiguration = nodemailer.createTransport({
    host: "smtp.qq.com",       // QQ's SMTP server
    port: 465,                 // Recommended port (465 with SSL)
    auth: {
        user: '3636722540@qq.com',  // Your full QQ email address
        pass: 'nzbxllrunuugcjjh' // The 16-character authorization code
    },
});


const sendRestEmail = async (email, token) => {
    const resetUrl = `http://localhost:5173/auth/reset-password?token=${token}`;


    const mailOptions = {
        from: '3636722540@qq.com',
        to: email,
        subject: 'The reset password request',
        html: `
      <h2>Reset Password</h2>
      <p>You request to reset password, please click the link to continue：</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>The link will be expired after one hour</p>
    `
    };

    await emailConfiguration.sendMail(mailOptions);
}




const sendSignUpEmail = async (email, token) => {
    const resetUrl = `http://localhost:3000/auth/register-confirm?token=${token}`;
    const mailOptions = {
        from: '3636722540@qq.com',
        to: email,
        subject: 'The register confirm email',
        html: `
      <h2>Register Confirmation</h2>
      <p>You request to register the account, please confirm the ：</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>The link will be expired after one hour</p>
    `}
    await emailConfiguration.sendMail(mailOptions);

}


/**
 * @swagger
 * /auth/request-reset:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetRequest'
 *     responses:
 *       200:
 *         description: The reset password email has been sent
 *       401:
 *         description: User does not exist
 *       500:
 *         description: The database has some problems
 */
//user request reset password
const requestResetPassword = async (req, res) => {
    const {email} = req.body;
    try {
        let user = await User.find({email: {$eq: email}}).limit(1);
        console.log(user[0])

        if (user.length !== 0) {
            user = user[0]
            const token = crypto.randomBytes(32).toString('hex');
            const expiryDate = Date.now() + 3600000;
            user.token = token
            user.expiryDate = expiryDate
            await user.save();
            await sendRestEmail(email, token);
            return res.status(200).json({
                message: 'The rest password email has been sent'
            });
        }
        else {
            return res.status(401).json({error: 'User does not exist'});
        }
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({
            message: 'The database has some problems',
            error: e
        })
    }


}


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: User login successful
 *       403:
 *         description: User not found or empty input
 *       404:
 *         description: There is an error for username or password
 *       500:
 *         description: The database has some problems
 */
// user login
const login = async (req, res) => {
    let  { email, password } = req.body;
    console.log("user login data", req.body)
    if (email && password) {
        try {
            const users = await User.find({email: {$eq: email}})
            console.log(users[0])
            if (users.length === 0) {
                return res.status(403).json({
                    message: 'User not found'
                });
            }
            else {
                for (let i = 0; i < users.length; i++) {
                    const check = await bcrypt.compare(password, users[i].password);
                    if (check) {
                        if (users[i].verification !== undefined){
                            if (Date.now() > users[i].registerTokenExpiryDate) {
                                const delete_result = User.deleteOne({_id: {$eq: users[i]._id}})
                                console.log("delete result", delete_result)
                                return res.status(403).json({
                                    message: "The user doesn't exist"
                                })
                            }
                            else {
                                return res.status(403).json({
                                    message: "The user didn't finish email verification, cannot login account"
                                })
                            }
                        }
                        req.session.user = {
                            id: users[i]._id,
                            firstname: users[i].firstname,
                            lastname: users[i].lastname,
                            email: users[i].email,
                        }
                        await new Promise((resolve, reject) => {
                            req.session.save(err => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });
                        users[i].lastLogin = new Date();
                        await users[i].save();
                        console.log("login successful")
                        return res.status(200).json({
                            message: 'User login successful',
                            user: req.session.user,
                        })
                    }
                }
                return res.status(404).json({
                    message: 'There is an error for username or password',
                })
            }
        }
        catch (e) {
            return res.status(500).json({
                message: 'The database has some problems',
                error: e
            })
        }


    }
    else {
        return res.status(403).json({
            message: 'The email or password is empty, please check input'
        })
    }
}



/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: logout successful
 *       500:
 *         description: logout unsuccessful
 */
// logout
const logout = async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('The logout has error', err);
            return res.status(500).json({
                message: 'logout unsuccessful' });
        }

        res.clearCookie('connect.sid');

        res.json({
            message: 'logout successful' });
    });
}


/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Signup new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: The user has created successful
 *       400:
 *         description: The user has existed
 *       403:
 *         description: There is a field is empty
 *       500:
 *         description: The new user created failure because the database problem
 */
// signup the new user
const signup = async (req, res) => {

    console.log("user sign up data", req.body)
    const  {firstName, lastName, email, password} = req.body

    if (firstName !== "" && lastName !== "" && email !== "" && password !== "") {

        const users = await User.find({firstname: {$eq: firstName}, lastname: {$eq: lastName}, email: {$eq: email}})
        for (let i=0; i < users.length; i++) {
            if ( bcrypt.compare(password, users[i].password)) {
                return res.status(400).json({
                    message: "The user has existed"
                })
            }
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        try {
            const registerToken = crypto.randomBytes(32).toString('hex');
            const registerTokenExpiryDate = Date.now() + 3600000;
            await User.create({
                firstname: firstName,
                lastname: lastName,
                email: email,
                password: hashedPassword,
                registerToken: registerToken,
                registerTokenExpiryDate: registerTokenExpiryDate,
                verification: false,
            })
            await sendSignUpEmail(email, registerToken)
            return res.status(200).json({
                message: "The user information has created, please check the email to finish the register new account."
            })
        } catch (e) {
            console.log(e)
            return res.status(500).json({
                message: "The new user created failure because the database problem",
                error: e
            })
        }
    }
    else {
        return res.status(403).json({
            message: "There is a field is empty, please check the input"
        })
    }

}


/**
 * @swagger
 * /auth/register-confirmation:
 *   get:
 *     summary: Confirm user registration with token
 *     description: |
 *       - Validates registration token from email
 *       - Deletes expired registrations automatically
 *       - Activates account if token is valid
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration token sent to user's email
 *     responses:
 *       200:
 *         description: User registration confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The user has registered successful"
 *                 userInformation:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Token validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   oneOf:
 *                     - example: "There is no user has this token."
 *                     - example: "The user register token has expired, the information has been deleted, please register again."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There are some problems in database"
 *                 error:
 *                   type: string
 *                   example: "MongoDB connection timeout"
 */
//signup confirmation
const registerConfirmation = async (req, res) => {
    const registerToken = req.query.token
    try {
        let users = await User.find({registerToken: {$eq: registerToken}})
        if (users.length === 0) {
            return res.status(403).json({
                message: 'There is no user has this token.'
            })
        }
        else {
            const user = users[0]
            if (Date.now() > user.registerTokenExpiryDate) {
                const result = User.deleteOne({_id:{$eq: user._id}})
                console.log("delete result", result)
                return res.status(403).json({
                    message: "The user register token has expired, the information has been deleted, please register again."
                })
            }
            else {
                user.registerTokenExpiryDate = undefined
                user.registerToken = undefined
                user.verification = undefined
                await user.save()
                console.log(user)
                return res.redirect('http://localhost:5173/')

            }
        }
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({
            message: "There are some problems in database",
            error: e
        })
    }
}



/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset user password with token
 *     tags: [Authentication]
 *     description: |
 *       Reset password using a valid token.
 *       Token can be provided either in query parameter or request body.
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token (alternative to query parameter)
 *               new_password:
 *                 type: string
 *                 description: New password to set
 *                 example: "NewSecurePassword123!"
 *     responses:
 *       200:
 *         description: The password change successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The password change successful"
 *       403:
 *         description: |
 *           Possible reasons:
 *           - The token is empty, please check the input
 *           - The user who own this token doesn't exist
 *           - The token data has expired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The token data has expired"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                   example: "Error details here"
 */

//reset password
const resetPassword = async (req, res) => {
    console.log("reset password data", req.body)
    // console.log("reset password parameter", req.query.token || req.body.token)
    // const token = req.query.token || req.body.token;
    const { token,  new_password } = req.body;
    console.log(new_password)
    if (token !== null) {
        try{
            let user = await User.find({token:{$eq:token}})
            user = user[0]
            if (user === undefined) {
                return res.status(403).json({
                    message: "The user who own this token doesn't exist"
                })
            }
            else {
                console.log(user)
                const expiryDate = user.expiryDate
                if (Date.now() > expiryDate) {
                    return res.status(403).json({
                        message: "The token data has expired"
                    })
                }
                else {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(new_password, salt)
                    user.token = undefined
                    user.expiryDate = undefined
                    user.save()
                    return res.status(200).json({
                        message: "The password change successful",
                    })
                }

            }
        }
        catch (e) {
            console.log(e)
            return res.status(500).json({
                message: "There is a problem for database",
                error: e
            })
        }

    }
    else {
        return res.status(403).json({
            message: "The token is empty, please check the input",
        })
    }
}


/**
 * @swagger
 * /auth/status:
 *   get:
 *     summary: Check user authentication status
 *     description: |
 *       Verifies user session status by:
 *       - Checking session user data
 *       - Validating session expiration
 *       - Returns user information if valid
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User session is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Get session successful"
 *                 userInformation:
 *                   type: object
 *                   description: User data from session
 *                   example:
 *                     id: "507f1f77bcf86cd799439011"
 *                     username: "john_doe"
 *                     email: "john@example.com"
 *       401:
 *         description: Session validation failed
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "The user session expired or invalid"
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Session expired"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 *     security:
 *       - cookieAuth: []
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: connect.sid
 *       description: Session cookie for authentication
 */
// get User Status
const getUserStatus = async (req, res) => {
    const user = req.session.user
    console.log(user)
    if (!user) {
        return res.status(401).json({ message: "The user session expired or invalid" });
    }
    try {
        const sessionDoc = await mongoose.connection.db.collection('sessions').findOne({ _id: req.sessionID });
        console.log("sessionDoc", sessionDoc)

        if (!sessionDoc || new Date() > sessionDoc.expires) {
            return res.status(401).json({ message: "Session expired" });
        }
        console.log("success")
        return res.status(200).json({
            message: "Get session successful",
            userInformation: user,
        })
    } catch (err) {
        console.error("Session check error:", err);
        res.status(500).json({ message: "Server error" });
    }
}



const getUserNameById = async (req, res) => {
    if (!req.body.userId) {
        console.warn("Attempted to get user name with empty ID.");
        return null;
    }
    const userId = req.body.userId

    try {
        const users = await User.find({ _id: userId });
        const user = users[0]

        let fullName = '';
        if (user.firstname && user.lastname) {
            fullName = `${user.firstname} ${user.lastname}`;
        } else if (user.firstname) {
            fullName = user.firstname;
        } else if (user.lastname) {
            fullName = user.lastname;
        }
        

        return res.status(200).json({
            message: "Get session successful",
            username: fullName,
        })

    } catch (err) {
        console.error(`Error fetching user name components for ID ${userId}:`, err);
        res.status(500).json({ message: "Server error" });
    }
};


/**
 * @swagger
 * /profiles:
 *   patch:
 *     tags:
 *       - Profiles
 *     summary: Update user profile
 *     description: Update user profile information after verifying current password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestData
 *             properties:
 *               requestData:
 *                 type: object
 *                 required:
 *                   - currentPassword
 *                   - profileData
 *                 properties:
 *                   currentPassword:
 *                     type: string
 *                     example: "123456789Qw*"
 *                     description: Current password for verification
 *                   profileData:
 *                     type: object
 *                     properties:
 *                       firstname:
 *                         type: string
 *                         example: "John"
 *                       lastname:
 *                         type: string
 *                         example: "Liang"
 *                       email:
 *                         type: string
 *                         format: email
 *                         example: "tghrtwld@gmail.com"
 *             example:
 *               requestData:
 *                 currentPassword: "123456789Qw*"
 *                 profileData:
 *                   lastname: "Liang"
 *                   email: "tghrtwld@gmail.com"
 *     responses:
 *       '200':
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile update successful"
 *       '403':
 *         description: Forbidden (invalid request)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   oneOf:
 *                     - example: "The profile data is null"
 *                     - example: "The user id is null, please provide user id and then try it again."
 *                     - example: "The password is not correct."
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "There is a problem for your database"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 *     security:
 *       - sessionAuth: []
 */

// update Profile
const updateProfile = async (req, res) => {
    console.log(req.body)
    const {requestData} = req.body
    const profileData = requestData.profileData
    const currentPassword = requestData.currentPassword
    console.log(currentPassword)
    console.log(profileData)
    if (profileData === null) {
        return res.status(403).json({
            message: "The profile data is null"
        })
    }
    else {
        const _id = req.session.user.id
        const firstname = profileData.firstname
        const lastname = profileData.lastname
        const email = profileData.email

        if (_id === null) {
            return res.status(403).json({
                message: "The user id is null, please provide user id and then try it again."
            })
        }
        else {
            try {
                let user = await User.findOne({_id: {$eq: _id }})

                const check = await bcrypt.compare(currentPassword, user.password);
                if (check) {
                    if (firstname) user.firstname = firstname;
                    if (lastname) user.lastname = lastname;
                    if (email) user.email = email;
                    console.log(user)
                    await user.save()
                    return res.status(200).json({
                        message: "Profile update successful"
                    })
                }
                else {
                    return res.status(403).json({
                        message: "The password is not correct."
                    })
                }

            }
            catch (e) {
                console.log(e)
                return res.status(500).json({
                    message: "There is a problem for your database",
                    error : e
                })
            }

        }
    }
}


// change password
const  changePassword = async (req, res) => {
    const {currentPassword, newPassword} = req.body;
    console.log(req.body)
    if (currentPassword === undefined || currentPassword === null || newPassword === undefined || newPassword === null) {
        return res.status(404).json({
            message: "The current password or new password is null."
        })
    } else {
        const user_id = req.session.user.id

        try {
            let user = await User.findOne({_id: {$eq: user_id}})
            if (user) {
                const check = await bcrypt.compare(currentPassword, user.password);
                if (check) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(newPassword, salt)
                    user.save()
                    return res.status(200).json({
                        message: "Password update successful",
                    })
                }
                else {
                    return res.status(403).json({
                        message: "The current password is not correct"
                    })
                }
            }
        } catch (e) {
            console.log(e)
            return res.status(500).json({
                message: "There is a problem for your database",
            })
        }
    }
}


module.exports = {
    login,
    signup,
    logout,
    requestResetPassword,
    resetPassword,
    registerConfirmation,
    getUserStatus,
    updateProfile,
    getUserNameById,
    changePassword,
}
