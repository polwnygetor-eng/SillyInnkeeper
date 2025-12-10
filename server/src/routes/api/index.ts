import { FastifyPluginAsync } from "fastify";
import settings from "./settings";
import cards from "./cards";

const api: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // Регистрируем роут настроек (префикс /api уже добавлен AutoLoad из имени папки)
  await fastify.register(settings);
  // Регистрируем роут карточек (префикс /api уже добавлен AutoLoad из имени папки)
  await fastify.register(cards);
};

export default api;
