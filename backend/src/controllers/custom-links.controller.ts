import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";

/**
 * CustomLinksController
 * 
 * Handles CRUD operations for user custom links (shortcuts).
 * Ensures that users can only manage their own links and that URLs are properly validated.
 */
export class CustomLinksController {
  static async getLinks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "fail", message: "Unauthorized." });
      }

      const links = await prisma.customLink.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });

      res.status(200).json({ status: "success", data: { links } });
    } catch (error) {
      next(error);
    }
  }

  static async createLink(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "fail", message: "Unauthorized." });
      }

      const { name, url, isArchived } = req.body;
      if (!name || !url) {
        return res.status(400).json({ status: "fail", message: "Name and URL are required." });
      }

      if (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//")) {
        return res.status(400).json({ status: "fail", message: "URL must be an internal path." });
      }

      const link = await prisma.customLink.create({
        data: {
          name,
          url,
          isArchived: isArchived ?? false,
          userId,
        },
      });

      res.status(201).json({ status: "success", data: { link } });
    } catch (error) {
      next(error);
    }
  }

  static async updateLink(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      if (!userId) {
        return res.status(401).json({ status: "fail", message: "Unauthorized." });
      }

      const { name, url, isArchived } = req.body;

      if (url !== undefined) {
        if (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//")) {
          return res.status(400).json({ status: "fail", message: "URL must be an internal path." });
        }
      }

      // Verify ownership
      const existingLink = await prisma.customLink.findUnique({ where: { id } });
      if (!existingLink || existingLink.userId !== userId) {
        return res.status(404).json({ status: "fail", message: "Link not found." });
      }

      const updatedLink = await prisma.customLink.update({
        where: { id },
        data: {
          name: name !== undefined ? name : undefined,
          url: url !== undefined ? url : undefined,
          isArchived: isArchived !== undefined ? isArchived : undefined,
        },
      });

      res.status(200).json({ status: "success", data: { link: updatedLink } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteLink(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      if (!userId) {
        return res.status(401).json({ status: "fail", message: "Unauthorized." });
      }

      // Verify ownership
      const existingLink = await prisma.customLink.findUnique({ where: { id } });
      if (!existingLink || existingLink.userId !== userId) {
        return res.status(404).json({ status: "fail", message: "Link not found." });
      }

      await prisma.customLink.delete({ where: { id } });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
