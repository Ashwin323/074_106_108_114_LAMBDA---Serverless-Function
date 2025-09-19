const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/users');

router.get('/', getUsers); // GET /users
router.get('/:id', getUserById); // GET /users/:id
router.post('/', createUser); // POST /users
router.put('/:id', updateUser); // PUT /users/:id
router.delete('/:id', deleteUser); // DELETE /users/:id

module.exports = router;

