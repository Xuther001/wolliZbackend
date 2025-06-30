import express from 'express';
import { getAllUsers, getUserById, createUser, deleteUser, updateUser, patchUser, loginUser } from '../controllers/userController.js';
import authenticateUser from '../middleware/authenticateUser.js';

const router = express.Router();

router.post('/register', createUser);
router.get('/getallusers', authenticateUser, getAllUsers);
router.get('/:id', authenticateUser, getUserById);
router.delete('/:id', authenticateUser, deleteUser);
router.put('/:id', authenticateUser, updateUser);
router.patch('/:id', authenticateUser, patchUser);
router.post('/login', loginUser);

export default router;