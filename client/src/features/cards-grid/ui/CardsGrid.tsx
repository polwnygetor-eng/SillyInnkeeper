import { Virtuoso } from "react-virtuoso";
import { useUnit } from "effector-react";
import { useMemo } from "react";
import { Loader, Alert, Text, Stack, Center, Box } from "@mantine/core";
import { $cards, $isLoading, $error } from "@/entities/cards";
import { $columnsCount, $isLocalStorageLoaded } from "@/features/view-settings";
import { Card } from "@/entities/cards/ui/Card";

export function CardsGrid() {
  const [cards, isLoading, error, columnsCount, isLocalStorageLoaded] = useUnit(
    [$cards, $isLoading, $error, $columnsCount, $isLocalStorageLoaded]
  );

  // Разбиваем карточки на строки для виртуализации
  const rows = useMemo(() => {
    const result: Array<Array<(typeof cards)[0]>> = [];
    for (let i = 0; i < cards.length; i += columnsCount) {
      result.push(cards.slice(i, i + columnsCount));
    }
    return result;
  }, [cards, columnsCount]);

  if (!isLocalStorageLoaded) {
    return (
      <Center h="50vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Загрузка настроек...</Text>
        </Stack>
      </Center>
    );
  }

  if (isLoading) {
    return (
      <Center h="50vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Загрузка карточек...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Ошибка">
        {error}
      </Alert>
    );
  }

  if (cards.length === 0) {
    return (
      <Center h="50vh">
        <Text c="dimmed" size="lg">
          Карточки не найдены
        </Text>
      </Center>
    );
  }

  return (
    <Box
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Virtuoso
        style={{ width: "100%" }}
        totalCount={rows.length}
        overscan={7}
        useWindowScroll
        itemContent={(index) => {
          const row = rows[index];
          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columnsCount}, 300px)`,
                gap: "16px",
                marginBottom: "16px",
                justifyContent: "center",
              }}
            >
              {row.map((card) => (
                <Card key={card.id} card={card} />
              ))}
              {/* Заполняем пустые ячейки в последней строке */}
              {row.length < columnsCount &&
                Array.from({ length: columnsCount - row.length }).map(
                  (_, i) => (
                    <div key={`empty-${i}`} style={{ width: "300px" }} />
                  )
                )}
            </div>
          );
        }}
      />
    </Box>
  );
}
