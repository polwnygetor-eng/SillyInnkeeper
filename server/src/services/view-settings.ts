import { readFile, writeFile, ensureDir } from "fs-extra";
import { join } from "node:path";
import { AppError } from "../errors/app-error";

export type ColumnsCount = 3 | 5 | 7;

export interface ViewSettings {
  columnsCount: ColumnsCount;
  isCensored: boolean;
}

const VIEW_SETTINGS_FILE_PATH = join(
  process.cwd(),
  "data",
  "view-settings.json"
);

const DEFAULT_SETTINGS: ViewSettings = {
  columnsCount: 5,
  isCensored: false,
};

/**
 * Валидирует значение columnsCount
 * @param value Значение для проверки
 * @returns true если значение валидно
 */
function isValidColumnsCount(value: number): value is ColumnsCount {
  return value === 3 || value === 5 || value === 7;
}

/**
 * Читает настройки отображения из файла. Если файл не существует, создает его с дефолтными значениями.
 * @returns Текущие настройки отображения
 */
export async function getViewSettings(): Promise<ViewSettings> {
  try {
    const data = await readFile(VIEW_SETTINGS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(data) as ViewSettings;

    // Валидация данных
    if (
      typeof parsed.columnsCount === "number" &&
      isValidColumnsCount(parsed.columnsCount) &&
      typeof parsed.isCensored === "boolean"
    ) {
      return parsed;
    }

    // Если данные невалидны, возвращаем дефолтные значения
    return DEFAULT_SETTINGS;
  } catch (error) {
    // Если файл не существует, создаем его с дефолтными значениями
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await ensureDir(join(process.cwd(), "data"));
      await writeFile(
        VIEW_SETTINGS_FILE_PATH,
        JSON.stringify(DEFAULT_SETTINGS, null, 2),
        "utf-8"
      );
      return DEFAULT_SETTINGS;
    }
    throw error;
  }
}

/**
 * Обновляет настройки отображения с валидацией
 * @param newSettings Новые настройки отображения
 * @throws Error если данные невалидны
 */
export async function updateViewSettings(
  newSettings: ViewSettings
): Promise<ViewSettings> {
  // Валидация данных
  if (
    typeof newSettings !== "object" ||
    newSettings === null ||
    typeof newSettings.columnsCount !== "number" ||
    !isValidColumnsCount(newSettings.columnsCount) ||
    typeof newSettings.isCensored !== "boolean"
  ) {
    throw new AppError({
      status: 400,
      code: "api.viewSettings.invalid_format",
    });
  }

  // Убеждаемся, что папка data существует
  await ensureDir(join(process.cwd(), "data"));

  // Сохраняем настройки
  await writeFile(
    VIEW_SETTINGS_FILE_PATH,
    JSON.stringify(newSettings, null, 2),
    "utf-8"
  );

  return newSettings;
}
