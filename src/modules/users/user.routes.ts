import { Router } from "express";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { validate } from "../../middlewares/validate";
import { authGuard } from "../../middlewares/authGuard";
import { requireRole } from "../../middlewares/requireRole";
import { createUserSchema, updateUserSchema, userByIdSchema } from "./user.dto";
import { FirebaseUserAdminProvider } from "../../providers/auth/firebaseUserAdminProvider";

const userRepository = new UserRepository();
const userService = new UserService(
  userRepository,
  new FirebaseUserAdminProvider()
);
const userController = new UserController(userService);

export const userRoutes = Router();

userRoutes.use(authGuard, requireRole("admin"));

userRoutes.get("/", userController.list);
userRoutes.get("/:id", validate(userByIdSchema), userController.getById);
userRoutes.post("/", validate(createUserSchema), userController.create);
userRoutes.patch("/:id", validate(updateUserSchema), userController.update);
userRoutes.delete("/:id", validate(userByIdSchema), userController.delete);
