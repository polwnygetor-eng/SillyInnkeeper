import fp from 'fastify-plugin'
import Database from 'better-sqlite3'
import { join } from 'node:path'
import { ensureDir } from 'fs-extra'

export interface DatabasePluginOptions {
  // Опции для плагина базы данных
  dbPath?: string
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<DatabasePluginOptions>(async (fastify, opts) => {
  // Путь к базе данных (по умолчанию в папке data)
  const dbPath = opts.dbPath || join(process.cwd(), 'data', 'database.db')
  
  // Убеждаемся, что папка data существует
  await ensureDir(join(process.cwd(), 'data'))
  
  // Создаем подключение к базе данных
  const db = new Database(dbPath)
  
  // Включаем WAL режим для лучшей производительности
  db.pragma('journal_mode = WAL')
  
  // Включаем foreign keys
  db.pragma('foreign_keys = ON')
  
  // Инициализируем схему базы данных (если нужно)
  initializeSchema(db)
  
  // Декорируем fastify экземпляром базы данных
  fastify.decorate('db', db)
  
  // Закрываем подключение при завершении работы приложения
  fastify.addHook('onClose', async () => {
    db.close()
  })
})

/**
 * Инициализирует схему базы данных
 * Создает необходимые таблицы, если они не существуют
 */
function initializeSchema(db: Database.Database): void {
  // Пример создания таблицы настроек
  // Можно расширить по необходимости
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
    
    -- Таблица карточек (метаданные)
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      tags TEXT,
      creator TEXT,
      spec_version TEXT,
      avatar_path TEXT,
      created_at INTEGER NOT NULL,
      data_json TEXT NOT NULL
    );
    
    -- Таблица физических файлов карточек
    CREATE TABLE IF NOT EXISTS card_files (
      file_path TEXT PRIMARY KEY,
      card_id TEXT NOT NULL,
      file_mtime INTEGER NOT NULL,
      file_size INTEGER NOT NULL,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
    );
    
    -- Индексы для производительности
    CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
    CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at);
    CREATE INDEX IF NOT EXISTS idx_card_files_card_id ON card_files(card_id);
  `)
}

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    db: Database.Database
  }
}

