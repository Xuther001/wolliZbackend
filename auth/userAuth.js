import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import models from '../models/index.js';

export async function login(req, res) {
  const { username, password } = req.body;
  const user = await models.User.findOne({ where: { username } });

  if (!user) return res.status(401).json({ error: 'User not found' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Incorrect password' });

  const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
}