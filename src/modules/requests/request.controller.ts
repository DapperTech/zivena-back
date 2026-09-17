import { BaseController } from "../../shared/controllers/BaseController";
import { RequestService } from "./request.service";

export class RequestController extends BaseController {
  constructor(private readonly requestService: RequestService) {
    super();
  }

  list = this.execute(async (_req, res) => {
    const requests = await this.requestService.listRequests();
    this.ok(res, requests);
  });

  getById = this.execute(async (req, res) => {
    const request = await this.requestService.getRequestById(String(req.params.id));
    this.ok(res, request);
  });

  create = this.execute(async (req, res) => {
    const request = await this.requestService.createRequest(req.body);
    this.ok(res, request, 201);
  });

  update = this.execute(async (req, res) => {
    const request = await this.requestService.updateRequest(String(req.params.id), req.body);
    this.ok(res, request);
  });
}
