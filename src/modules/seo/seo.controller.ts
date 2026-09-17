import { BaseController } from "../../shared/controllers/BaseController";
import { SeoRepository } from "./seo.repository";

export class SeoController extends BaseController {
  constructor(private readonly seoRepository: SeoRepository) {
    super();
  }

  sitemapData = this.execute(async (_req, res) => {
    const data = await this.seoRepository.sitemapData();
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
    this.ok(res, data);
  });
}
