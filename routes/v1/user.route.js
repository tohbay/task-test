import { Router } from 'express';
import { userExist, isSelf } from '../../middleware/users.middleware';
import UserController from '../../controllers/user.controller';
import validationMiddleware from '../../middleware/validation.middleware';
import authMiddleware from '../../middleware/auth.middleware';
import paginationValidations from '../../middleware/pagination.validation';
import superAdminCheck from '../../middleware/permission.middleware';

const router = Router();
const validateRequest = validationMiddleware();

router.post('/signup', validateRequest, UserController.createAccount);

router.post('/login', validateRequest, UserController.loginUser);

router.put(
  '/:id',
  validateRequest,
  authMiddleware,
  UserController.updateProfile
);

router.patch(
  '/verify/:token',
  validateRequest,
  authMiddleware,
  UserController.verifyUser
);

router.get('/', paginationValidations, UserController.listUsers);

router.patch(
  '/unfollow',
  authMiddleware,
  validateRequest,
  isSelf,
  userExist,
  UserController.unfollowUser
);

router.patch(
  '/follow',
  authMiddleware,
  validateRequest,
  isSelf,
  userExist,
  UserController.followUser
);

router.patch(
  '/:id/role',
  validateRequest,
  authMiddleware,
  superAdminCheck,
  UserController.updateRole
);
router.get('/:id', validateRequest, authMiddleware, UserController.viewProfile);

export default router;
