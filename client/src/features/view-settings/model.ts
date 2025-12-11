import { createStore, createEvent, createEffect, sample } from "effector";

// Типы
export type ColumnsCount = 3 | 5 | 7;

interface ViewSettings {
  columnsCount: ColumnsCount;
  isCensored: boolean;
}

const STORAGE_KEY = "view-settings";
const DEFAULT_SETTINGS: ViewSettings = {
  columnsCount: 5,
  isCensored: false,
};

// Stores
export const $columnsCount = createStore<ColumnsCount>(
  DEFAULT_SETTINGS.columnsCount
);
export const $isCensored = createStore<boolean>(DEFAULT_SETTINGS.isCensored);
export const $isLocalStorageLoaded = createStore<boolean>(false);

// Events
export const setColumnsCount = createEvent<ColumnsCount>();
export const toggleCensorship = createEvent<void>();

// Effects
export const loadFromLocalStorageFx = createEffect<void, ViewSettings, Error>(
  async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ViewSettings;
        // Валидация данных
        if (
          typeof parsed.columnsCount === "number" &&
          [3, 5, 7].includes(parsed.columnsCount) &&
          typeof parsed.isCensored === "boolean"
        ) {
          return parsed;
        }
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error("Ошибка загрузки настроек из localStorage:", error);
      return DEFAULT_SETTINGS;
    }
  }
);

export const saveToLocalStorageFx = createEffect<ViewSettings, void, Error>(
  async (settings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Ошибка сохранения настроек в localStorage:", error);
      throw error;
    }
  }
);

// Обновление stores через события
$columnsCount.on(setColumnsCount, (_, count) => count);
$isCensored.on(toggleCensorship, (current) => !current);

// Загрузка из localStorage
sample({
  clock: loadFromLocalStorageFx.doneData,
  fn: (settings) => settings.columnsCount,
  target: $columnsCount,
});

sample({
  clock: loadFromLocalStorageFx.doneData,
  fn: (settings) => settings.isCensored,
  target: $isCensored,
});

sample({
  clock: loadFromLocalStorageFx.finally,
  fn: () => true,
  target: $isLocalStorageLoaded,
});

// Сохранение в localStorage при изменении настроек
sample({
  clock: [setColumnsCount, toggleCensorship],
  source: { columnsCount: $columnsCount, isCensored: $isCensored },
  fn: ({ columnsCount, isCensored }) => ({ columnsCount, isCensored }),
  target: saveToLocalStorageFx,
});
