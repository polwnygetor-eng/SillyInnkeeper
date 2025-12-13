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

  getCreators(libraryId: string): FilterOption[] {
    const sql = `
      SELECT 
        c.creator as value,
        COUNT(*) as count
      FROM cards c
      WHERE c.library_id = ? AND c.creator IS NOT NULL AND TRIM(c.creator) != ''
      GROUP BY c.creator
      ORDER BY count DESC, value COLLATE NOCASE ASC
    `;

    return this.dbService.query<FilterOption>(sql, [libraryId]);
  }

  getSpecVersions(libraryId: string): FilterOption[] {
    const sql = `
      SELECT 
        c.spec_version as value,
        COUNT(*) as count
      FROM cards c
      WHERE c.library_id = ? AND c.spec_version IS NOT NULL AND TRIM(c.spec_version) != ''
      GROUP BY c.spec_version
      ORDER BY count DESC, value COLLATE NOCASE ASC
    `;

    return this.dbService.query<FilterOption>(sql, [libraryId]);
  }

  getTags(libraryId: string): FilterOption[] {
    const sql = `
      SELECT 
        t.name as value,
        COUNT(DISTINCT ct.card_id) as count
      FROM tags t
      JOIN card_tags ct ON ct.tag_rawName = t.rawName
      JOIN cards c ON c.id = ct.card_id
      WHERE c.library_id = ?
      GROUP BY t.rawName, t.name
      ORDER BY count DESC, value COLLATE NOCASE ASC
    `;

    return this.dbService.query<FilterOption>(sql, [libraryId]);
  }

  getFilters(libraryId: string): CardsFiltersResponse {
    return {
      creators: this.getCreators(libraryId),
      spec_versions: this.getSpecVersions(libraryId),
      tags: this.getTags(libraryId),
    };
  }
}

export function createCardsFiltersService(
  db: Database.Database
): CardsFiltersService {
  const dbService = createDatabaseService(db);
  return new CardsFiltersService(dbService);
}
