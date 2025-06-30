import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import models from '../models/index.js';

export const createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    const existingUser = await models.User.findOne({ where: { username } });
    if (existingUser) return res.status(409).json({ error: 'Username already taken' });

    const existingEmail = await models.User.findOne({ where: { email } });
    if (existingEmail) return res.status(409).json({ error: 'Email already in use' });

    const newUser = await models.User.create({ username, email, password });
    const userResponse = newUser.toJSON();
    delete userResponse.password;

    return res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    const user = await models.User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await models.User.findAll({
      attributes: { exclude: ['password'] }
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await models.User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await models.User.findByPk(req.params.id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    user.username = username;
    user.email = email;
    if (password) user.password = password;
    await user.save();

    const userResponse = user.toJSON();
    delete userResponse.password;

    return res.status(200).json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const patchUser = async (req, res) => {
  try {
    const user = await models.User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    Object.assign(user, req.body);
    await user.save();

    const userResponse = user.toJSON();
    delete userResponse.password;

    return res.status(200).json(userResponse);
  } catch (error) {
    console.error('Error patching user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await models.User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.destroy();
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};