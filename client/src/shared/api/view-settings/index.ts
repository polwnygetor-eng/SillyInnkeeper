export type ColumnsCount = 3 | 5 | 7;

export interface ViewSettings {
  columnsCount: ColumnsCount;
  isCensored: boolean;
}

export async function getViewSettings(): Promise<ViewSettings> {
  const response = await fetch("/api/view-settings");

  if (!response.ok) {
    throw new Error(
      `Ошибка загрузки настроек отображения: ${response.statusText}`
    );
  }

  return response.json();
}

export async function updateViewSettings(
  settings: ViewSettings
): Promise<ViewSettings> {
  const response = await fetch("/api/view-settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText ||
        `Ошибка сохранения настроек отображения: ${response.statusText}`
    );
  }

  return response.json();
}
