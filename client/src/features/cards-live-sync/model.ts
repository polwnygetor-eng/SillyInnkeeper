import { createEvent, sample } from "effector";
import { createEventsClient, type EventsClient } from "@/shared/api/events";
import type {
  CardsResyncedEvent,
  CardsScanFinishedEvent,
  CardsScanProgressEvent,
  CardsScanStartedEvent,
} from "@/shared/types/events";
import { applyFilters, loadCardsFiltersFx } from "@/features/cards-filters";
import { notifications } from "@mantine/notifications";

export const startLiveSync = createEvent<void>();
export const stopLiveSync = createEvent<void>();

const cardsResynced = createEvent<CardsResyncedEvent>();
const scanStarted = createEvent<CardsScanStartedEvent>();
const scanProgress = createEvent<CardsScanProgressEvent>();
const scanFinished = createEvent<CardsScanFinishedEvent>();
const connected = createEvent<void>();

let client: EventsClient | null = null;

const SCAN_NOTIFICATION_ID = "scan-status";

function shortFolderLabel(folderPath: string): string {
  const parts = folderPath.split(/[\\/]+/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : folderPath;
}

startLiveSync.watch(() => {
  if (client) return;
  client = createEventsClient({
    onHello: () => connected(),
    onResynced: (evt) => cardsResynced(evt),
    onScanStarted: (evt) => scanStarted(evt),
    onScanProgress: (evt) => scanProgress(evt),
    onScanFinished: (evt) => scanFinished(evt),
    onError: () => {
      // браузер сам переподключается; лог/UX добавим позже при необходимости
    },
  });
});

stopLiveSync.watch(() => {
  client?.close();
  client = null;
});

// На resync: перезагружаем фильтры (опции) и карточки с текущими фильтрами
sample({
  clock: cardsResynced,
  target: loadCardsFiltersFx,
});

sample({
  clock: cardsResynced,
  target: applyFilters,
});

// При подключении: один раз синхронизируем UI (важно, если стартовый scan прошёл до подключения SSE)
sample({
  clock: connected,
  target: loadCardsFiltersFx,
});

sample({
  clock: connected,
  target: applyFilters,
});

// Прогресс сканирования (через Notifications)
scanStarted.watch((evt) => {
  const total = Math.max(0, evt.totalFiles);
  const folder = shortFolderLabel(evt.folderPath);
  notifications.show({
    id: SCAN_NOTIFICATION_ID,
    title: "Сканирование карточек",
    message: `Папка: ${folder} • 0/${total} (0%)`,
    loading: true,
    autoClose: false,
    withCloseButton: false,
  });
});

scanProgress.watch((evt) => {
  const total = Math.max(0, evt.totalFiles);
  const done = Math.min(
    Math.max(0, evt.processedFiles),
    total || evt.processedFiles
  );
  const percent =
    total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const folder = shortFolderLabel(evt.folderPath);
  notifications.update({
    id: SCAN_NOTIFICATION_ID,
    title: "Сканирование карточек",
    message: `Папка: ${folder} • ${done}/${total} (${percent}%)`,
    loading: true,
    autoClose: false,
    withCloseButton: false,
  });
});

scanFinished.watch((evt) => {
  const total = Math.max(0, evt.totalFiles);
  const done = Math.max(0, evt.processedFiles);
  const seconds = (evt.durationMs / 1000).toFixed(1);
  const folder = shortFolderLabel(evt.folderPath);
  notifications.update({
    id: SCAN_NOTIFICATION_ID,
    title: "Сканирование завершено",
    message: `Папка: ${folder} • ${done}/${total} • ${seconds}с`,
    loading: false,
    autoClose: 2500,
    withCloseButton: true,
  });
});

cardsResynced.watch((evt) => {
  if (evt.addedCards <= 0 && evt.removedCards <= 0) return;
  const parts: string[] = [];
  if (evt.addedCards > 0) parts.push(`Добавлено: ${evt.addedCards}`);
  if (evt.removedCards > 0) parts.push(`Удалено: ${evt.removedCards}`);
  const seconds = (evt.durationMs / 1000).toFixed(1);
  const folder = shortFolderLabel(evt.folderPath);
  notifications.show({
    title: "Библиотека обновлена",
    message: `Папка: ${folder} • ${parts.join(", ")} • ${seconds}с`,
  });
});

export const cardsResyncedEvent = cardsResynced;
