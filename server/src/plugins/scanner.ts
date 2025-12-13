import Database from "better-sqlite3";
import { existsSync } from "node:fs";
import { getSettings } from "../services/settings";
import { logger } from "../utils/logger";
import type { CardsSyncOrchestrator } from "../services/cards-sync-orchestrator";
import { getOrCreateLibraryId } from "../services/libraries";

/**
 * Инициализирует автоматическое сканирование при старте сервера
 * @param db Экземпляр базы данных
 */
export async function initializeScanner(db: Database.Database): Promise<void> {
  // Читаем настройки
  try {
    const settings = await getSettings();

    // Если cardsFolderPath указан и папка существует, запускаем сканирование
    if (
      settings.cardsFolderPath !== null &&
      existsSync(settings.cardsFolderPath)
    ) {
      logger.info(`Автозапуск сканирования папки: ${settings.cardsFolderPath}`);

      // db параметр оставлен для обратной совместимости сигнатуры старого вызова,
      // но фактический запуск идёт через orchestrator.
      void db;
      logger.warn(
        "initializeScanner(db) устарел: используйте initializeScannerWithOrchestrator(orchestrator)"
      );
    } else {
      logger.info(
        "cardsFolderPath не указан или папка не существует, сканирование не запущено"
      );
    }
  } catch (error) {
    logger.error(
      error,
      "Ошибка при чтении настроек для автозапуска сканирования"
    );
  }
}

export async function initializeScannerWithOrchestrator(
  orchestrator: CardsSyncOrchestrator,
  db: Database.Database
): Promise<void> {
  try {
    const settings = await getSettings();
    if (
      settings.cardsFolderPath !== null &&
      existsSync(settings.cardsFolderPath)
    ) {
      logger.info(`Автозапуск сканирования папки: ${settings.cardsFolderPath}`);
      const libraryId = getOrCreateLibraryId(db, settings.cardsFolderPath);
      orchestrator.requestScan("app", settings.cardsFolderPath, libraryId);
    }
  } catch (error) {
    logger.error(
      error,
      "Ошибка при чтении настроек для автозапуска сканирования"
    );
  }
}
