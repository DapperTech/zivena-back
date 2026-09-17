import { BaseController } from "../../shared/controllers/BaseController";
import { ProviderService } from "./provider.service";

export class ProviderController extends BaseController {
  constructor(private readonly providerService: ProviderService) {
    super();
  }

  list = this.execute(async (_req, res) => {
    const providers = await this.providerService.listProviders();
    this.ok(res, providers);
  });

  getById = this.execute(async (req, res) => {
    const provider = await this.providerService.getProviderById(String(req.params.id));
    this.ok(res, provider);
  });

  create = this.execute(async (req, res) => {
    const provider = await this.providerService.createProvider(req.body);
    this.ok(res, provider, 201);
  });

  update = this.execute(async (req, res) => {
    const provider = await this.providerService.updateProvider(String(req.params.id), req.body);
    this.ok(res, provider);
  });
}
