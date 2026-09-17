export interface IRepository<T, TCreate, TUpdate> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(payload: TCreate): Promise<T>;
  updateById(id: string, payload: TUpdate): Promise<T | null>;
}
