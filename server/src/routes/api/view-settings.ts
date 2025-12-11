import { Router, Request, Response } from "express";
import {
  getViewSettings,
  updateViewSettings,
  ViewSettings,
} from "../../services/view-settings";
import { logger } from "../../utils/logger";

const router = Router();

// GET /api/view-settings - получение текущих настроек отображения
router.get("/view-settings", async (req: Request, res: Response) => {
  try {
    const settings = await getViewSettings();
    res.json(settings);
  } catch (error) {
    logger.error(error, "Ошибка при получении настроек отображения");
    res
      .status(500)
      .json({ error: "Не удалось получить настройки отображения" });
  }
});

// PUT /api/view-settings - обновление настроек отображения (полное обновление)
router.put("/view-settings", async (req: Request, res: Response) => {
  try {
    const newSettings = req.body as ViewSettings;

    // Валидация структуры данных
    if (
      typeof newSettings !== "object" ||
      newSettings === null ||
      !("columnsCount" in newSettings) ||
      !("isCensored" in newSettings)
    ) {
      res.status(400).json({
        error:
          "Неверный формат данных. Ожидается объект с полями columnsCount и isCensored",
      });
      return;
    }

    // Полное обновление настроек (валидация происходит внутри updateViewSettings)
    const savedSettings = await updateViewSettings(newSettings);

    res.json(savedSettings);
  } catch (error) {
    logger.error(error, "Ошибка при обновлении настроек отображения");

    // Если ошибка валидации, возвращаем подробную ошибку
    if (
      error instanceof Error &&
      error.message.includes("Неверный формат данных")
    ) {
      res.status(400).json({ error: error.message });
      return;
    }

    res
      .status(500)
      .json({ error: "Не удалось обновить настройки отображения" });
  }
});

export default router;
