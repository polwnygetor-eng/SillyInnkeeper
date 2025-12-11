import Database from "better-sqlite3";
import { statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { readdir as readdirAsync, writeFile, ensureDir } from "fs-extra";
import pLimit from "p-limit";
import { randomUUID } from "node:crypto";
import { createDatabaseService, DatabaseService } from "./database";
import { parsePngMetadata } from "./png-parser";
import { generateThumbnail, deleteThumbnail } from "./thumbnail";

const CONCURRENT_LIMIT = 5;

interface CardData {
  name?: string;
  description?: string;
  tags?: string[];
  creator?: string;
  [key: string]: unknown;
}

/**
 * Сервис для сканирования папки с карточками и синхронизации с базой данных
 */
export class ScanService {
  private limit = pLimit(CONCURRENT_LIMIT);
  private scannedFiles = new Set<string>();

  constructor(private dbService: DatabaseService) {}

  /**
   * Рекурсивно сканирует папку и обрабатывает все PNG файлы
   * @param folderPath Путь к папке для сканирования
   */
  async scanFolder(folderPath: string): Promise<void> {
    if (!existsSync(folderPath)) {
      console.error(`Папка не существует: ${folderPath}`);
      return;
    }

    console.log(`Начало сканирования папки: ${folderPath}`);
    this.scannedFiles.clear();

    try {
      // Рекурсивно получаем все файлы
      const files = await this.getAllPngFiles(folderPath);
      console.log(`Найдено ${files.length} PNG файлов`);

      // Обрабатываем файлы с ограничением конкурентности
      const promises = files.map((file) =>
        this.limit(() => this.processFile(file))
      );
      await Promise.all(promises);

      // Очищаем удаленные файлы
      await this.cleanupDeletedFiles();

      console.log(`Сканирование завершено. Обработано файлов: ${files.length}`);
    } catch (error) {
      console.error(`Ошибка при сканировании папки ${folderPath}:`, error);
    }
  }

  /**
   * Рекурсивно получает все PNG файлы из папки
   */
  private async getAllPngFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await readdirAsync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Рекурсивно сканируем подпапки
        const subFiles = await this.getAllPngFiles(fullPath);
        files.push(...subFiles);
      } else if (
        entry.isFile() &&
        extname(entry.name).toLowerCase() === ".png"
      ) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Обрабатывает один PNG файл
   * @param filePath Путь к файлу
   */
  private async processFile(filePath: string): Promise<void> {
    try {
      // Отмечаем файл как обработанный
      this.scannedFiles.add(filePath);

      // Получаем статистику файла
      const stats = statSync(filePath);
      const fileMtime = stats.mtimeMs;
      const fileSize = stats.size;

      // Проверяем, изменился ли файл
      const existingFile = this.dbService.queryOne<{
        card_id: string;
        file_mtime: number;
        file_size: number;
      }>(
        "SELECT card_id, file_mtime, file_size FROM card_files WHERE file_path = ?",
        [filePath]
      );

      // Если файл не изменился, пропускаем
      if (
        existingFile &&
        existingFile.file_mtime === fileMtime &&
        existingFile.file_size === fileSize
      ) {
        return;
      }

      // Парсим метаданные
      const parsedData = parsePngMetadata(filePath);
      if (!parsedData) {
        console.error(`Не удалось распарсить метаданные из ${filePath}`);
        return;
      }

      const cardData = parsedData.data as CardData;

      // Определяем cardId: используем существующий или создаем новый
      const cardId = existingFile ? existingFile.card_id : randomUUID();

      // Генерируем миниатюру (только если карточка новая или миниатюра отсутствует)
      let avatarPath: string | null = null;
      if (!existingFile) {
        avatarPath = await generateThumbnail(filePath, cardId);
      } else {
        // Проверяем, есть ли уже миниатюра
        const existingCard = this.dbService.queryOne<{
          avatar_path: string | null;
        }>("SELECT avatar_path FROM cards WHERE id = ?", [cardId]);
        if (!existingCard?.avatar_path) {
          avatarPath = await generateThumbnail(filePath, cardId);
        } else {
          avatarPath = existingCard.avatar_path;
        }
      }

      // Извлекаем поля из данных карточки
      const name = cardData.name || null;
      const description = cardData.description || null;
      const tags = cardData.tags ? JSON.stringify(cardData.tags) : null;
      const creator = cardData.creator || null;
      const specVersion = parsedData.spec_version;
      const dataJson = JSON.stringify(cardData);
      const createdAt = Date.now();

      // Записываем в БД в транзакции
      this.dbService.transaction((db) => {
        const dbService = createDatabaseService(db);

        // Если файл уже был в БД, обновляем карточку
        if (existingFile) {
          // Обновляем карточку
          dbService.execute(
            `UPDATE cards SET 
              name = ?, 
              description = ?, 
              tags = ?, 
              creator = ?, 
              spec_version = ?, 
              avatar_path = ?, 
              data_json = ?
            WHERE id = ?`,
            [
              name,
              description,
              tags,
              creator,
              specVersion,
              avatarPath,
              dataJson,
              existingFile.card_id,
            ]
          );

          // Обновляем информацию о файле
          dbService.execute(
            `UPDATE card_files SET 
              file_mtime = ?, 
              file_size = ?
            WHERE file_path = ?`,
            [fileMtime, fileSize, filePath]
          );
        } else {
          // Создаем новую карточку
          dbService.execute(
            `INSERT INTO cards (
              id, name, description, tags, creator, spec_version, avatar_path, created_at, data_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              cardId,
              name,
              description,
              tags,
              creator,
              specVersion,
              avatarPath,
              createdAt,
              dataJson,
            ]
          );

          // Создаем запись о файле
          dbService.execute(
            `INSERT INTO card_files (file_path, card_id, file_mtime, file_size)
            VALUES (?, ?, ?, ?)`,
            [filePath, cardId, fileMtime, fileSize]
          );
        }
      });

      // Сохраняем JSON файл с данными карточки (только если включено через переменную окружения)
      if (process.env.ENABLE_JSON_CACHE === "true") {
        const jsonDir = join(process.cwd(), "data", "cache", "json");
        await ensureDir(jsonDir);
        const jsonPath = join(jsonDir, `${cardId}.json`);
        const jsonData = {
          db: {
            id: cardId,
            name,
            description,
            tags: cardData.tags || null,
            creator,
            spec_version: specVersion,
            avatar_path: avatarPath,
            created_at: createdAt,
            data_json: cardData,
          },
          raw: parsedData,
        };
        await writeFile(jsonPath, JSON.stringify(jsonData, null, 2), "utf-8");
      }
    } catch (error) {
      console.error(`Ошибка при обработке файла ${filePath}:`, error);
    }
  }

  /**
   * Удаляет записи о файлах, которых больше нет на диске
   */
  private async cleanupDeletedFiles(): Promise<void> {
    try {
      // Получаем все файлы из БД
      const dbFiles = this.dbService.query<{
        file_path: string;
        card_id: string;
      }>("SELECT file_path, card_id FROM card_files");

      const filesToDelete: Array<{ file_path: string; card_id: string }> = [];

      // Проверяем каждый файл
      for (const dbFile of dbFiles) {
        if (!existsSync(dbFile.file_path)) {
          filesToDelete.push(dbFile);
        }
      }

      if (filesToDelete.length === 0) {
        return;
      }

      console.log(
        `Найдено ${filesToDelete.length} удаленных файлов для очистки`
      );

      // Удаляем файлы из БД
      // CASCADE автоматически удалит карточки без файлов
      for (const file of filesToDelete) {
        // Получаем avatar_path перед удалением карточки
        const card = this.dbService.queryOne<{ avatar_path: string | null }>(
          "SELECT avatar_path FROM cards WHERE id = ?",
          [file.card_id]
        );

        // Удаляем файл из БД (CASCADE удалит карточку если нет других файлов)
        this.dbService.execute("DELETE FROM card_files WHERE file_path = ?", [
          file.file_path,
        ]);

        // Проверяем, остались ли еще файлы у этой карточки
        const remainingFiles = this.dbService.queryOne<{ count: number }>(
          "SELECT COUNT(*) as count FROM card_files WHERE card_id = ?",
          [file.card_id]
        );

        // Если файлов не осталось, удаляем миниатюру
        if (remainingFiles && remainingFiles.count === 0 && card?.avatar_path) {
          const uuid = card.avatar_path.split("/").pop()?.replace(".webp", "");
          if (uuid) {
            await deleteThumbnail(uuid);
          }
        }
      }
    } catch (error) {
      console.error("Ошибка при очистке удаленных файлов:", error);
    }
  }
}

/**
 * Создает экземпляр ScanService из экземпляра Database
 */
export function createScanService(db: Database.Database): ScanService {
  const dbService = createDatabaseService(db);
  return new ScanService(dbService);
}
