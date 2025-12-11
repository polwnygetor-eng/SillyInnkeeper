import {
  createStore,
  createEffect,
  createEvent,
  sample,
  combine,
} from "effector";
import { getCards } from "@/shared/api/cards";
import type { CardListItem } from "@/shared/types/cards";
import type { CardsQuery } from "@/shared/types/cards-query";

// Effects
export const loadCardsFx = createEffect<
  CardsQuery | void,
  CardListItem[],
  Error
>(async (query) => {
  return await getCards(query as CardsQuery | undefined);
});

// Stores
export const $cards = createStore<CardListItem[]>([]);
export const $error = createStore<string | null>(null);

// Объединение pending состояний
export const $isLoading = combine(loadCardsFx.pending, (pending) => pending);

// Events
const setCards = createEvent<CardListItem[]>();
const setError = createEvent<string | null>();

// Обновление stores через события
$cards.on(setCards, (_, cards) => cards);
$error.on(setError, (_, error) => error);

// Связывание effects с событиями
sample({
  clock: loadCardsFx.doneData,
  target: setCards,
});

sample({
  clock: loadCardsFx.doneData,
  fn: () => null,
  target: setError,
});

sample({
  clock: loadCardsFx.failData,
  fn: (error: Error) => error.message,
  target: setError,
});
