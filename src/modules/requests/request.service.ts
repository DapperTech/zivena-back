import { NotFoundAppError } from "../../shared/errors/AppError";
import { CreateRequestDto, UpdateRequestDto } from "./request.dto";
import { RequestRepository } from "./request.repository";
import { RequestEntity } from "./request.types";

export class RequestService {
  constructor(private readonly requestRepository: RequestRepository) {}

  async listRequests(): Promise<RequestEntity[]> {
    return this.requestRepository.findAll();
  }

  async getRequestById(id: string): Promise<RequestEntity> {
    const request = await this.requestRepository.findById(id);
    if (!request) {
      throw new NotFoundAppError("Request not found");
    }

    return request;
  }

  async createRequest(payload: CreateRequestDto): Promise<RequestEntity> {
    return this.requestRepository.create(payload);
  }

  async updateRequest(id: string, payload: UpdateRequestDto): Promise<RequestEntity> {
    const request = await this.requestRepository.updateById(id, payload);
    if (!request) {
      throw new NotFoundAppError("Request not found");
    }

    return request;
  }
}
