import type { CardListItem } from "@/shared/types/cards";

export async function getCards(): Promise<CardListItem[]> {
  const response = await fetch("/api/cards");

  if (!response.ok) {
    throw new Error(`Ошибка загрузки карточек: ${response.statusText}`);
  }

  return response.json();
}
