import Database from "better-sqlite3";
import { createDatabaseService, DatabaseService } from "./database";

export interface FilterOption {
  value: string;
  count: number;
}

export interface CardsFiltersResponse {
  creators: FilterOption[];
  spec_versions: FilterOption[];
  tags: FilterOption[];
}

export class CardsFiltersService {
  constructor(private dbService: DatabaseService) {}

  getCreators(): FilterOption[] {
    const sql = `
      SELECT 
        c.creator as value,
        COUNT(*) as count
      FROM cards c
      WHERE c.creator IS NOT NULL AND TRIM(c.creator) != ''
      GROUP BY c.creator
      ORDER BY count DESC, value COLLATE NOCASE ASC
    `;

    return this.dbService.query<FilterOption>(sql);
  }

  getSpecVersions(): FilterOption[] {
    const sql = `
      SELECT 
        c.spec_version as value,
        COUNT(*) as count
      FROM cards c
      WHERE c.spec_version IS NOT NULL AND TRIM(c.spec_version) != ''
      GROUP BY c.spec_version
      ORDER BY count DESC, value COLLATE NOCASE ASC
    `;

    return this.dbService.query<FilterOption>(sql);
  }

  getTags(): FilterOption[] {
    // Возвращаем t.name как value: клиент нормализует trim().toLowerCase() -> rawName
    const sql = `
      SELECT 
        t.name as value,
        COUNT(ct.card_id) as count
      FROM tags t
      LEFT JOIN card_tags ct ON ct.tag_rawName = t.rawName
      GROUP BY t.rawName, t.name
      ORDER BY count DESC, value COLLATE NOCASE ASC
    `;

    return this.dbService.query<FilterOption>(sql);
  }

  getFilters(): CardsFiltersResponse {
    return {
      creators: this.getCreators(),
      spec_versions: this.getSpecVersions(),
      tags: this.getTags(),
    };
  }
}

export function createCardsFiltersService(
  db: Database.Database
): CardsFiltersService {
  const dbService = createDatabaseService(db);
  return new CardsFiltersService(dbService);
}
