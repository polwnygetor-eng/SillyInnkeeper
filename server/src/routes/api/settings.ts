import { FastifyPluginAsync } from "fastify";
import { getSettings, updateSettings, Settings } from "../../services/settings";
import { createScanService } from "../../services/scan";

const settings: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // GET /api/settings - получение текущих настроек
  fastify.get("/settings", async function (request, reply) {
    try {
      const settings = await getSettings();
      return settings;
    } catch (error) {
      fastify.log.error(error, "Ошибка при получении настроек");
      reply.code(500);
      return { error: "Не удалось получить настройки" };
    }
  });

  // PUT /api/settings - обновление настроек (полное обновление)
  fastify.put<{ Body: Settings }>("/settings", async function (request, reply) {
    try {
      const newSettings = request.body;

      // Валидация структуры данных
      if (
        typeof newSettings !== "object" ||
        newSettings === null ||
        !("cardsFolderPath" in newSettings) ||
        !("sillytavenrPath" in newSettings)
      ) {
        reply.code(400);
        return {
          error:
            "Неверный формат данных. Ожидается объект с полями cardsFolderPath и sillytavenrPath",
        };
      }

      // Полное обновление настроек (валидация путей происходит внутри updateSettings)
      const savedSettings = await updateSettings(newSettings);

      // Если обновлен cardsFolderPath и путь валиден, запускаем сканирование
      if (savedSettings.cardsFolderPath !== null) {
        try {
          const scanService = createScanService(fastify.db);
          // Запускаем сканирование асинхронно, не блокируя ответ
          scanService
            .scanFolder(savedSettings.cardsFolderPath)
            .catch((error) => {
              fastify.log.error(
                error,
                "Ошибка при сканировании после обновления настроек"
              );
            });
        } catch (error) {
          fastify.log.error(error, "Ошибка при запуске сканирования");
        }
      }

      return savedSettings;
    } catch (error) {
      fastify.log.error(error, "Ошибка при обновлении настроек");

      // Если ошибка валидации пути, возвращаем подробную ошибку
      if (
        error instanceof Error &&
        error.message.includes("Путь не существует")
      ) {
        reply.code(400);
        return { error: error.message };
      }

      reply.code(500);
      return { error: "Не удалось обновить настройки" };
    }
  });
};

export default settings;
