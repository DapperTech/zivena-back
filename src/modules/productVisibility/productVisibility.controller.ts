import { BaseController } from "../../shared/controllers/BaseController";
import { ProductVisibilityService } from "./productVisibility.service";

export class ProductVisibilityController extends BaseController {
  constructor(private readonly service: ProductVisibilityService) {
    super();
  }

  list = this.execute(async (_req, res) => {
    this.ok(res, await this.service.list());
  });

  set = this.execute(async (req, res) => {
    const visibility = await this.service.setVisibility(
      String(req.params.sku),
      Boolean(req.body.isVisible),
      req.user?.uid
    );
    this.ok(res, visibility);
  });
}
