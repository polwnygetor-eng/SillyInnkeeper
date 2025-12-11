import type { Tag } from "@/shared/types/tags";

export async function getTags(): Promise<Tag[]> {
  const response = await fetch("/api/tags");

  if (!response.ok) {
    throw new Error(`Ошибка загрузки тегов: ${response.statusText}`);
  }

  return response.json();
}
