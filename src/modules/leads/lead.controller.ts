import { BaseController } from "../../shared/controllers/BaseController";
import { UnauthorizedAppError } from "../../shared/errors/AppError";
import { LeadService } from "./lead.service";

export class LeadController extends BaseController {
  constructor(private readonly service: LeadService) {
    super();
  }

  createWebsite = this.execute(async (req, res) => {
    this.ok(res, await this.service.createWebsite(req.body), 201);
  });

  list = this.execute(async (req, res) => {
    if (!req.user) throw new UnauthorizedAppError();
    this.ok(res, await this.service.list(req.user));
  });

  getById = this.execute(async (req, res) => {
    if (!req.user) throw new UnauthorizedAppError();
    this.ok(res, await this.service.getById(String(req.params.id), req.user));
  });

  create = this.execute(async (req, res) => {
    if (!req.user) throw new UnauthorizedAppError();
    this.ok(res, await this.service.create(req.body, req.user), 201);
  });

  update = this.execute(async (req, res) => {
    if (!req.user) throw new UnauthorizedAppError();
    this.ok(res, await this.service.update(String(req.params.id), req.body, req.user));
  });

  delete = this.execute(async (req, res) => {
    await this.service.delete(String(req.params.id));
    this.ok(res, { deleted: true });
  });
}
