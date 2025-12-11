import { Router, Request, Response } from "express";
import Database from "better-sqlite3";
import { existsSync } from "node:fs";
import { createDatabaseService } from "../../services/database";
import { logger } from "../../utils/logger";

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
      "SELECT file_path FROM card_files WHERE card_id = ? LIMIT 1",
      [id]
    );

    if (!fileRow || !fileRow.file_path) {
      res.status(404).json({ error: "Изображение не найдено" });
      return;
    }

    const filePath = fileRow.file_path;

    // Проверяем существование файла
    if (!existsSync(filePath)) {
      res.status(404).json({ error: "Файл изображения не найден" });
      return;
    }

    // Отправляем файл с правильным Content-Type
    res.setHeader("Content-Type", "image/png");
    res.sendFile(filePath);
  } catch (error) {
    logger.error(error, "Ошибка при получении изображения");
    res.status(500).json({ error: "Не удалось получить изображение" });
  }
});

export default router;
