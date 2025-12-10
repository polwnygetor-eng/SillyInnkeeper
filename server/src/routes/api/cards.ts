import { FastifyPluginAsync } from "fastify";
import { createCardsService } from "../../services/cards";

const cards: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // GET /api/cards - получение списка карточек
  fastify.get("/cards", async function (request, reply) {
    try {
      const cardsService = createCardsService(fastify.db);
      const cardsList = cardsService.getCardsList();
      return cardsList;
    } catch (error) {
      fastify.log.error(error, "Ошибка при получении списка карточек");
      reply.code(500);
      return { error: "Не удалось получить список карточек" };
    }
  });
};

export default cards;
