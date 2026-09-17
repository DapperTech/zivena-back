import { BaseController } from "../../shared/controllers/BaseController";
import { UnauthorizedAppError } from "../../shared/errors/AppError";
import { QuotationService } from "./quotation.service";

export class QuotationController extends BaseController {
  constructor(private readonly service: QuotationService) {
    super();
  }

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

  generate = this.execute(async (req, res) => {
    if (!req.user) throw new UnauthorizedAppError();
    this.ok(res, await this.service.generate(String(req.params.id), req.user));
  });

  delete = this.execute(async (req, res) => {
    if (!req.user) throw new UnauthorizedAppError();
    await this.service.delete(String(req.params.id), req.user);
    this.ok(res, { deleted: true });
  });
}
