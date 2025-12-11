import { createStore, createEvent, createEffect, sample } from "effector";
import {
  getViewSettings,
  updateViewSettings,
  type ViewSettings,
} from "@/shared/api/view-settings";

// Типы
export type ColumnsCount = 3 | 5 | 7;

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
export const loadFromApiFx = createEffect<void, ViewSettings, Error>(
  async () => {
    try {
      return await getViewSettings();
    } catch (error) {
      console.error("Ошибка загрузки настроек отображения:", error);
      return DEFAULT_SETTINGS;
    }
  }
);

export const saveToApiFx = createEffect<ViewSettings, ViewSettings, Error>(
  async (settings) => {
    try {
      return await updateViewSettings(settings);
    } catch (error) {
      console.error("Ошибка сохранения настроек отображения:", error);
      throw error;
    }
  }
);

// Обновление stores через события
$columnsCount.on(setColumnsCount, (_, count) => count);
$isCensored.on(toggleCensorship, (current) => !current);

// Загрузка из API
sample({
  clock: loadFromApiFx.doneData,
  fn: (settings) => settings.columnsCount,
  target: $columnsCount,
});

sample({
  clock: loadFromApiFx.doneData,
  fn: (settings) => settings.isCensored,
  target: $isCensored,
});

sample({
  clock: loadFromApiFx.finally,
  fn: () => true,
  target: $isLocalStorageLoaded,
});

// Сохранение в API при изменении настроек
sample({
  clock: [setColumnsCount, toggleCensorship],
  source: { columnsCount: $columnsCount, isCensored: $isCensored },
  fn: ({ columnsCount, isCensored }) => ({ columnsCount, isCensored }),
  target: saveToApiFx,
});

// Обновление stores после успешного сохранения на сервере
sample({
  clock: saveToApiFx.doneData,
  fn: (settings) => settings.columnsCount,
  target: $columnsCount,
});

sample({
  clock: saveToApiFx.doneData,
  fn: (settings) => settings.isCensored,
  target: $isCensored,
});
