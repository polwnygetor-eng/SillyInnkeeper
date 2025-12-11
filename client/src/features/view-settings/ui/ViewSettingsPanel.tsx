import {
  Paper,
  Group,
  SegmentedControl,
  Switch,
  Text,
  Code,
} from "@mantine/core";
import { useUnit } from "effector-react";
import {
  $columnsCount,
  $isCensored,
  setColumnsCount,
  toggleCensorship,
} from "../model";
import { $cards } from "@/entities/cards";

export function ViewSettingsPanel() {
  const [columnsCount, isCensored, setColumns, toggleCensor, cards] = useUnit([
    $columnsCount,
    $isCensored,
    setColumnsCount,
    toggleCensorship,
    $cards,
  ]);

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder mb="xl">
      <Group justify="space-between" align="center">
        <Group gap="lg">
          <Group gap="xs">
            <Text size="sm" fw={500}>
              Колонок:
            </Text>
            <SegmentedControl
              value={columnsCount.toString()}
              onChange={(value) => setColumns(Number(value) as 3 | 5 | 7)}
              data={[
                { label: "3", value: "3" },
                { label: "5", value: "5" },
                { label: "7", value: "7" },
              ]}
            />
          </Group>
          <Text size="sm">Карточек: {cards.length}</Text>
        </Group>

        <Group gap="xs">
          <Text size="sm" fw={500}>
            Цензура:
          </Text>
          <Switch
            checked={isCensored}
            onChange={() => toggleCensor()}
            label={isCensored ? "Включена" : "Выключена"}
          />
        </Group>
      </Group>
    </Paper>
  );
}
