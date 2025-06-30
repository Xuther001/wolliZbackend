import models from '../index.js';
import { generateToken } from '../util/JwtUtil.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

const { User } = models;

const loginUser = async (email, password) => {
    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            throw new Error('Invalid email or password');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            throw new Error('Invalid email or password');
        }

        const token = generateToken(user);
        return { user, token };
    } catch (error) {
        throw new Error('Login failed: ' + error.message);
    }
};

const createUser = async (userData) => {
    try {
        const newUser = await User.create(userData);
        const token = generateToken(newUser);
        return { user: newUser, token };
    } catch (error) {
        throw new Error('Error creating user: ' + error.message);
    }
};

const getAllUsers = async () => {
    try {
        const users = await User.findAll({ 
            attributes: ['username', 'email']
        });
        return users;
    } catch (error) {
        throw new Error('Error fetching users: ' + error.message);
    }
};

const getUserById = async (userId) => {
    try {
        const user = await User.findByPk(userId, {
            attributes: ['username', 'email']
        });
        return user;
    } catch (error) {
        throw new Error('Error fetching user by ID: ' + error.message);
    }
};

const updateUser = async (userId, updateData) => {
    try {

        const { username, email } = updateData;

        const { existingUserByUsername, existingUserByEmail } = await checkUserExists(username, email, userId);

        if (existingUserByUsername) {
            throw new Error('Username is already taken');
        }
        
        if (existingUserByEmail) {
            throw new Error('Email is already in use');
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return null;
        }
        const updatedUser = await user.update(updateData);
        const token = generateToken(updatedUser);
        return { user: updatedUser, token };
    } catch (error) {
        throw new Error('Error updating user: ' + error.message);
    }
};

const patchUser = async (userId, patchData) => {
    try {

        const { username, email } = patchData;

        const { existingUserByUsername, existingUserByEmail } = await checkUserExists(username, email, userId);

        if (existingUserByUsername) {
            throw new Error('Username is already taken');
        }
        
        if (existingUserByEmail) {
            throw new Error('Email is already in use');
        }
        const user = await User.findByPk(userId);
        if (!user) {
            return null;
        }
        const patchedUser = await user.update(patchData, { fields: Object.keys(patchData) });
        const token = generateToken(patchedUser);
        return { user: patchedUser, token };
    } catch (error) {
        throw new Error('Error patching user: ' + error.message);
    }
};

const deleteUser = async (userId) => {
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return null;
        }
        await user.destroy();
    } catch (error) {
        throw new Error('Error deleting user: ' + error.message);
    }
};

const checkUserExists = async (username, email, userId) => {
    const existingUserByUsername = await User.findOne({
        where: { username, user_id: { [Op.ne]: userId } }
    });

    const existingUserByEmail = await User.findOne({
        where: { email, user_id: { [Op.ne]: userId } }
    });

    return {
        existingUserByUsername,
        existingUserByEmail,
    };
};

export default {
    loginUser,
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    patchUser,
    deleteUser
};