const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res, next) => {
    try {
        const { email, password } = req.body; // 'email' field acts as loginIdentifier

        const user = await User.findOne({
            $or: [
                { email: email.trim() },
                { username: email.trim() }
            ]
        });

        console.log('Login attempt identifier:', `[${email}]`);
        if (!user) {
            console.log('User not found for identifier');
        } else {
            const isMatch = await user.matchPassword(password);
            console.log('User found:', user.email);
            console.log('Password match result:', isMatch);
        }

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                token: generateToken(user._id),
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
    try {
        const {
            name, email, password, role,
            registerNumber, department, academicYear, semester,
            designation, qualifications, phoneNumber, specialization
        } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            department: department || null,
        });

        if (user) {
            if (role === 'student') {
                await Student.create({
                    user: user._id,
                    registerNumber,
                    academicYear,
                    semester,
                });
            } else if (role === 'teacher') {
                await Teacher.create({
                    user: user._id,
                    designation,
                    qualifications,
                    phoneNumber,
                    specialization,
                });
            }

            // Send Email with Credentials
            const emailTemplate = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2563eb; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Welcome to Academic Portal</h1>
                        <div style="height: 4px; width: 60px; background-color: #2563eb; margin: 10px auto;"></div>
                    </div>
                    
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
                    
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your <strong>${role === 'student' ? 'Student' : 'Faculty'}</strong> account has been initialized by the administration. You can now access your personalized dashboard using the following secure credentials:</p>
                    
                    <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; margin: 25px 0;">
                        <div style="margin-bottom: 15px;">
                            <span style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 5px;">Portal Email</span>
                            <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${email}</span>
                        </div>
                        <div>
                            <span style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 5px;">Temporary Password</span>
                            <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${password}</span>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">ACCESS YOUR DASHBOARD</a>
                    </div>
                    
                    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 30px;">
                        <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; font-style: italic;">Important: For security purposes, we recommend that you synchronize your profile and update your password immediately after your first successful login.</p>
                        
                        <p style="color: #64748b; font-size: 14px; font-weight: 600; margin-top: 20px;">Best Regards,<br><span style="color: #2563eb;">Academic Administration System</span></p>
                    </div>
                </div>
            `;

            try {
                await sendEmail({
                    email: email,
                    subject: `Credentials Synchronized - Welcome to ${role === 'student' ? 'Student' : 'Faculty'} Portal`,
                    message: `Welcome to the Academic Portal. Your account has been initialized.\n\nEmail: ${email}\nPassword: ${password}\n\nPlease update your password after logging in.`,
                    html: emailTemplate,
                });
                console.log(`Success: Registration credentials dispatched to ${email}`);
            } catch (mailError) {
                console.error(`Warning: User registered but email failure to ${email}:`, mailError.message);
            }

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.username = req.body.username || user.username;
            user.avatar = req.body.avatar || user.avatar;
            user.phone = req.body.phone || user.phone;
            user.address = req.body.address || user.address;
            user.designation = req.body.designation || user.designation;
            user.bio = req.body.bio || user.bio;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                avatar: updatedUser.avatar,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    authUser,
    registerUser,
    getUserProfile,
    updateUserProfile,
};


