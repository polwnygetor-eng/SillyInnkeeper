import fp from "fastify-plugin";
import { existsSync } from "node:fs";
import { getSettings } from "../services/settings";
import { createScanService } from "../services/scan";

/**
 * Плагин для автоматического запуска сканирования при старте сервера
 * Использует onReady хук для запуска после полной инициализации сервера
 */
export default fp(async (fastify) => {
  // Используем хук onReady для запуска после полной инициализации
  fastify.addHook("onReady", async () => {
    // Читаем настройки
    try {
      const settings = await getSettings();

      // Если cardsFolderPath указан и папка существует, запускаем сканирование
      if (
        settings.cardsFolderPath !== null &&
        existsSync(settings.cardsFolderPath)
      ) {
        fastify.log.info(
          `Автозапуск сканирования папки: ${settings.cardsFolderPath}`
        );

        const scanService = createScanService(fastify.db);

        // Запускаем сканирование асинхронно, не блокируя старт сервера
        scanService.scanFolder(settings.cardsFolderPath).catch((error) => {
          fastify.log.error(error, "Ошибка при автозапуске сканирования");
        });
      } else {
        fastify.log.info(
          "cardsFolderPath не указан или папка не существует, сканирование не запущено"
        );
      }
    } catch (error) {
      fastify.log.error(
        error,
        "Ошибка при чтении настроек для автозапуска сканирования"
      );
    }
  });
});

