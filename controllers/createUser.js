import models from '../models/index.js';

export const createUser = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password and email are required' });
    }

    const existingUser = await models.User.findOne({
      where: {
        [models.Sequelize.Op.or]: [{ username }, { email }]
      }
    });
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    const newUser = await models.User.create({ username, password, email });

    const { password: _, ...userWithoutPassword } = newUser.toJSON();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};