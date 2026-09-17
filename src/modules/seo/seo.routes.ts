import { Router } from "express";
import { SeoController } from "./seo.controller";
import { SeoRepository } from "./seo.repository";

const seoController = new SeoController(new SeoRepository());

export const seoRoutes = Router();

seoRoutes.get("/sitemap-data", seoController.sitemapData);
