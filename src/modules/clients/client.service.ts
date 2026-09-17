import { NotFoundAppError } from "../../shared/errors/AppError";
import { CreateClientDto, UpdateClientDto } from "./client.dto";
import { ClientRepository } from "./client.repository";
import { ClientEntity } from "./client.types";

export class ClientService {
  constructor(private readonly clientRepository: ClientRepository) {}

  async listClients(): Promise<ClientEntity[]> {
    return this.clientRepository.findAll();
  }

  async getClientById(id: string): Promise<ClientEntity> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new NotFoundAppError("Client not found");
    }

    return client;
  }

  async createClient(payload: CreateClientDto): Promise<ClientEntity> {
    return this.clientRepository.create(payload);
  }

  async updateClient(id: string, payload: UpdateClientDto): Promise<ClientEntity> {
    const client = await this.clientRepository.updateById(id, payload);
    if (!client) {
      throw new NotFoundAppError("Client not found");
    }

    return client;
  }
}
