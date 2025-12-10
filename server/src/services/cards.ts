import Database from "better-sqlite3";
import { createDatabaseService, DatabaseService } from "./database";

export interface CardListItem {
  id: string;
  name: string | null;
  tags: string[] | null;
  creator: string | null;
  avatar_url: string;
  file_path: string | null;
}

/**
 * Сервис для работы с карточками
 */
export class CardsService {
  constructor(private dbService: DatabaseService) {}

  /**
   * Получает список всех карточек (без data_json для производительности)
   * @returns Массив карточек с основными полями
   */
  getCardsList(): CardListItem[] {
    // SQL запрос выбирает только легкие колонки, без data_json
    // Подзапрос для получения первого file_path из card_files
    const sql = `
      SELECT 
        c.id,
        c.name,
        c.tags,
        c.creator,
        c.avatar_path,
        (
          SELECT cf.file_path 
          FROM card_files cf 
          WHERE cf.card_id = c.id 
          LIMIT 1
        ) as file_path
      FROM cards c
      ORDER BY c.created_at DESC
    `;

    const rows = this.dbService.query<{
      id: string;
      name: string | null;
      tags: string | null;
      creator: string | null;
      avatar_path: string | null;
      file_path: string | null;
    }>(sql);

    // Преобразуем результаты в формат ответа
    return rows.map((row) => {
      // Парсим tags из JSON строки
      let tags: string[] | null = null;
      if (row.tags) {
        try {
          tags = JSON.parse(row.tags) as string[];
        } catch {
          tags = null;
        }
      }

      // Формируем avatar_url
      const avatarUrl = row.avatar_path
        ? `/api/thumbnail/${row.id}`
        : "/api/thumbnail/default";

      return {
        id: row.id,
        name: row.name,
        tags,
        creator: row.creator,
        avatar_url: avatarUrl,
        file_path: row.file_path,
      };
    });
  }
}

/**
 * Создает экземпляр CardsService из экземпляра Database
 */
export function createCardsService(db: Database.Database): CardsService {
  const dbService = createDatabaseService(db);
  return new CardsService(dbService);
}
