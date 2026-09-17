import { BaseController } from "../../shared/controllers/BaseController";
import { UserService } from "./user.service";

export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  list = this.execute(async (_req, res) => {
    const users = await this.userService.listUsers();
    this.ok(res, users);
  });

  getById = this.execute(async (req, res) => {
    const id = String(req.params.id);
    const user = await this.userService.getUserById(id);
    this.ok(res, user);
  });

  create = this.execute(async (req, res) => {
    const user = await this.userService.createUser(req.body);
    this.ok(res, user, 201);
  });

  update = this.execute(async (req, res) => {
    const id = String(req.params.id);
    const user = await this.userService.updateUser(id, req.body);
    this.ok(res, user);
  });

  delete = this.execute(async (req, res) => {
    await this.userService.deleteUser(String(req.params.id), req.user?.uid);
    res.status(204).send();
  });
}
