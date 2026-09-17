import { BaseController } from "../../shared/controllers/BaseController";
import { ClientService } from "./client.service";

export class ClientController extends BaseController {
  constructor(private readonly clientService: ClientService) {
    super();
  }

  list = this.execute(async (_req, res) => {
    const clients = await this.clientService.listClients();
    this.ok(res, clients);
  });

  getById = this.execute(async (req, res) => {
    const client = await this.clientService.getClientById(String(req.params.id));
    this.ok(res, client);
  });

  create = this.execute(async (req, res) => {
    const client = await this.clientService.createClient(req.body);
    this.ok(res, client, 201);
  });

  update = this.execute(async (req, res) => {
    const client = await this.clientService.updateClient(String(req.params.id), req.body);
    this.ok(res, client);
  });
}
