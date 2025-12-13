import { Router, Request, Response } from "express";
import Database from "better-sqlite3";
import { createTagService } from "../../services/tags";
import { logger } from "../../utils/logger";
import { AppError } from "../../errors/app-error";
import { sendError } from "../../errors/http";

const router = Router();

// Middleware для получения базы данных из app.locals
function getDb(req: Request): Database.Database {
  return req.app.locals.db as Database.Database;
}

// GET /api/tags - получение списка всех тегов
router.get("/tags", async (req: Request, res: Response) => {
  try {
    const db = getDb(req);
    const tagService = createTagService(db);
    const tags = tagService.getAllTags();
    res.json(tags);
  } catch (error) {
    logger.errorKey(error, "api.tags.list_failed");
    return sendError(res, error, { status: 500, code: "api.tags.list_failed" });
  }
});

// POST /api/tags - создание нового тега
router.post("/tags", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    // Валидация входных данных
    if (typeof name !== "string") {
      throw new AppError({ status: 400, code: "api.tags.name_invalid" });
    }

    const db = getDb(req);
    const tagService = createTagService(db);
    const tag = tagService.createTag(name);
    res.status(201).json(tag);
  } catch (error: any) {
    logger.errorKey(error, "api.tags.create_failed");
    return sendError(res, error, {
      status: 500,
      code: "api.tags.create_failed",
    });
  }
});

// GET /api/tags/:id - получение тега по ID
router.get("/tags/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb(req);
    const tagService = createTagService(db);
    const tag = tagService.getTagById(id);

    if (!tag) {
      throw new AppError({ status: 404, code: "api.tags.not_found" });
    }

    res.json(tag);
  } catch (error) {
    logger.errorKey(error, "api.tags.get_failed");
    return sendError(res, error, { status: 500, code: "api.tags.get_failed" });
  }
});

// PUT /api/tags/:id - полное обновление тега
router.put("/tags/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Валидация входных данных
    if (typeof name !== "string") {
      throw new AppError({ status: 400, code: "api.tags.name_invalid" });
    }

    const db = getDb(req);
    const tagService = createTagService(db);
    const tag = tagService.updateTag(id, name);
    res.json(tag);
  } catch (error: any) {
    logger.errorKey(error, "api.tags.update_failed");
    return sendError(res, error, {
      status: 500,
      code: "api.tags.update_failed",
    });
  }
});

// PATCH /api/tags/:id - частичное обновление тега
router.patch("/tags/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Валидация входных данных
    if (typeof name !== "string") {
      throw new AppError({ status: 400, code: "api.tags.name_invalid" });
    }

    const db = getDb(req);
    const tagService = createTagService(db);
    const tag = tagService.patchTag(id, name);
    res.json(tag);
  } catch (error: any) {
    logger.errorKey(error, "api.tags.update_failed");
    return sendError(res, error, {
      status: 500,
      code: "api.tags.update_failed",
    });
  }
});

// DELETE /api/tags/:id - удаление тега
router.delete("/tags/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb(req);
    const tagService = createTagService(db);
    tagService.deleteTag(id);
    res.json({ message: "Тег успешно удален" });
  } catch (error: any) {
    logger.errorKey(error, "api.tags.delete_failed");
    return sendError(res, error, {
      status: 500,
      code: "api.tags.delete_failed",
    });
  }
});

export default router;
