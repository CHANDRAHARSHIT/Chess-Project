import type { Request, Response, NextFunction } from "express";
import { DocumentService } from "./document.service.js";

export class DocumentController {
  /** GET /api/admin/documents */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { items, total, limit, offset } = await DocumentService.list(req.query);
      res.status(200).json({ status: "success", data: { documents: items, total, limit, offset } });
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/admin/documents */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await DocumentService.create(req.body ?? {}, req.adminUser!.id);
      res.status(201).json({ status: "success", data: { document } });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/admin/documents/:id */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await DocumentService.getById(req.params.id);
      res.status(200).json({ status: "success", data: { document } });
    } catch (error) {
      next(error);
    }
  }

  /** PATCH /api/admin/documents/:id */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await DocumentService.update(req.params.id, req.body ?? {});
      res.status(200).json({ status: "success", data: { document } });
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /api/admin/documents/:id */
  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await DocumentService.remove(req.params.id, req.adminUser!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
