import type { Request, Response, NextFunction } from "express";
import { DocumentService } from "./document.service.js";

const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;

/**
 * HTTP layer for /api/admin/documents.
 *
 * Deliberately thin: it reads the request, calls DocumentService, and shapes the
 * response. All validation and business rules live in the service, and errors are
 * passed to the shared error middleware rather than formatted here.
 */
export class DocumentController {
  /** GET /api/admin/documents */
  static async listDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { items, total, limit, offset } = await DocumentService.getDocuments(req.query);

      res.status(HTTP_OK).json({
        status: "success",
        data: { documents: items, total, limit, offset },
      });
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/admin/documents */
  static async createDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await DocumentService.createDocument(req.body ?? {}, req.adminUser!.id);

      res.status(HTTP_CREATED).json({ status: "success", data: { document } });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/admin/documents/:id */
  static async getDocumentById(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await DocumentService.getDocumentById(req.params.id);

      res.status(HTTP_OK).json({ status: "success", data: { document } });
    } catch (error) {
      next(error);
    }
  }

  /** PATCH /api/admin/documents/:id */
  static async updateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const document = await DocumentService.updateDocument(req.params.id, req.body ?? {});

      res.status(HTTP_OK).json({ status: "success", data: { document } });
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /api/admin/documents/:id — soft delete. */
  static async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      await DocumentService.deleteDocument(req.params.id, req.adminUser!.id);

      res.status(HTTP_NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }
}
