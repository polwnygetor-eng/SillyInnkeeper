import { Router, Request, Response } from "express";
import Database from "better-sqlite3";
import { existsSync } from "node:fs";
import { createDatabaseService } from "../../services/database";
import { logger } from "../../utils/logger";
import { AppError } from "../../errors/app-error";
import { sendError } from "../../errors/http";

const router = Router();

// Middleware для получения базы данных из app.locals
function getDb(req: Request): Database.Database {
  return req.app.locals.db as Database.Database;
}

// GET /api/image/:id - получение оригинального PNG изображения карточки
router.get("/image/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const db = getDb(req);
    const dbService = createDatabaseService(db);

    // Получаем file_path из таблицы card_files по card_id
    const fileRow = dbService.queryOne<{ file_path: string }>(
      "SELECT file_path FROM card_files WHERE card_id = ? ORDER BY file_birthtime ASC, file_path ASC LIMIT 1",
      [id]
    );

    if (!fileRow || !fileRow.file_path) {
      throw new AppError({ status: 404, code: "api.image.not_found" });
    }

    const filePath = fileRow.file_path;

    // Проверяем существование файла
    if (!existsSync(filePath)) {
      throw new AppError({ status: 404, code: "api.image.file_not_found" });
    }

    // Отправляем файл с правильным Content-Type
    res.setHeader("Content-Type", "image/png");
    res.sendFile(filePath);
  } catch (error) {
    logger.errorKey(error, "api.image.get_failed");
    return sendError(res, error, { status: 500, code: "api.image.get_failed" });
  }
});

export default router;
