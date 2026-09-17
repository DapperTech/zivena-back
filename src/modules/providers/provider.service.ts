import { NotFoundAppError } from "../../shared/errors/AppError";
import { CreateProviderDto, UpdateProviderDto } from "./provider.dto";
import { ProviderRepository } from "./provider.repository";
import { ProviderEntity } from "./provider.types";

export class ProviderService {
  constructor(private readonly providerRepository: ProviderRepository) {}

  async listProviders(): Promise<ProviderEntity[]> {
    return this.providerRepository.findAll();
  }

  async getProviderById(id: string): Promise<ProviderEntity> {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new NotFoundAppError("Provider not found");
    }

    return provider;
  }

  async createProvider(payload: CreateProviderDto): Promise<ProviderEntity> {
    return this.providerRepository.create(payload);
  }

  async updateProvider(id: string, payload: UpdateProviderDto): Promise<ProviderEntity> {
    const provider = await this.providerRepository.updateById(id, payload);
    if (!provider) {
      throw new NotFoundAppError("Provider not found");
    }

    return provider;
  }
}
