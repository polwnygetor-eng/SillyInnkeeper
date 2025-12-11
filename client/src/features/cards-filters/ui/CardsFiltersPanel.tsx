import { useUnit } from "effector-react";
import {
  Alert,
  Button,
  Divider,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  MultiSelect,
  Paper,
} from "@mantine/core";
import {
  $filters,
  $filtersData,
  $filtersError,
  $filtersLoading,
  applyFilters,
  loadCardsFiltersFx,
  resetFilters,
  setAlternateGreetingsMin,
  setCreatedFrom,
  setCreatedTo,
  setCreators,
  setHasCharacterBook,
  setHasCreatorNotes,
  setHasMesExample,
  setHasPersonality,
  setHasPostHistoryInstructions,
  setHasScenario,
  setHasSystemPrompt,
  setName,
  setSort,
  setSpecVersions,
  setTags,
} from "../model";
import type { TriState } from "@/shared/types/cards-query";

const TRI_STATE_DATA: Array<{ value: TriState; label: string }> = [
  { value: "any", label: "Не важно" },
  { value: "1", label: "Только с" },
  { value: "0", label: "Только без" },
];

const SORT_DATA = [
  { value: "created_at_desc", label: "Сначала новые" },
  { value: "created_at_asc", label: "Сначала старые" },
  { value: "name_asc", label: "Имя: А → Я" },
  { value: "name_desc", label: "Имя: Я → А" },
] as const;

export function CardsFiltersPanel() {
  const [
    filters,
    filtersData,
    filtersError,
    filtersLoading,
    loadFilters,
    onSetSort,
    onSetName,
    onSetCreators,
    onSetSpecVersions,
    onSetTags,
    onSetCreatedFrom,
    onSetCreatedTo,
    onSetHasCreatorNotes,
    onSetHasSystemPrompt,
    onSetHasPostHistoryInstructions,
    onSetHasPersonality,
    onSetHasScenario,
    onSetHasMesExample,
    onSetHasCharacterBook,
    onSetAlternateGreetingsMin,
    onReset,
    onApply,
  ] = useUnit([
    $filters,
    $filtersData,
    $filtersError,
    $filtersLoading,
    loadCardsFiltersFx,
    setSort,
    setName,
    setCreators,
    setSpecVersions,
    setTags,
    setCreatedFrom,
    setCreatedTo,
    setHasCreatorNotes,
    setHasSystemPrompt,
    setHasPostHistoryInstructions,
    setHasPersonality,
    setHasScenario,
    setHasMesExample,
    setHasCharacterBook,
    setAlternateGreetingsMin,
    resetFilters,
    applyFilters,
  ]);

  const creatorOptions = filtersData.creators.map((c) => ({
    value: c.value,
    label: `${c.value} (${c.count})`,
  }));

  const specVersionOptions = filtersData.spec_versions.map((v) => ({
    value: v.value,
    label: `${v.value} (${v.count})`,
  }));

  const tagOptions = filtersData.tags.map((t) => ({
    value: t.value,
    label: `${t.value} (${t.count})`,
  }));

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Text fw={600}>Поиск и фильтры</Text>
          <Group gap="sm">
            <Button
              variant="default"
              onClick={() => {
                onReset();
              }}
            >
              Сбросить
            </Button>
            <Button
              onClick={() => {
                onApply();
              }}
            >
              Применить
            </Button>
            <Button
              variant="light"
              loading={filtersLoading}
              onClick={() => {
                loadFilters();
              }}
            >
              Обновить списки
            </Button>
          </Group>
        </Group>

        {filtersError && (
          <Alert color="red" title="Ошибка загрузки фильтров">
            {filtersError}
          </Alert>
        )}

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          <TextInput
            label="Имя"
            placeholder="Поиск по имени..."
            value={filters.name}
            onChange={(e) => onSetName(e.currentTarget.value)}
          />

          <Select
            label="Сортировка"
            data={[...SORT_DATA] as any}
            value={filters.sort}
            onChange={(v) => {
              if (v) onSetSort(v as any);
            }}
          />

          <NumberInput
            label="Alternate greetings: минимум"
            min={0}
            value={filters.alternate_greetings_min}
            onChange={(v) => onSetAlternateGreetingsMin(Number(v) || 0)}
          />

          <MultiSelect
            label="Создатель"
            data={creatorOptions}
            value={filters.creator}
            onChange={onSetCreators}
            searchable
            clearable
          />

          <MultiSelect
            label="Версия спеки"
            data={specVersionOptions}
            value={filters.spec_version}
            onChange={onSetSpecVersions}
            searchable
            clearable
          />

          <MultiSelect
            label="Теги (AND)"
            data={tagOptions}
            value={filters.tags}
            onChange={onSetTags}
            searchable
            clearable
          />

          <TextInput
            label="Создано: от"
            type="date"
            value={filters.created_from || ""}
            onChange={(e) =>
              onSetCreatedFrom(
                e.currentTarget.value.trim().length > 0
                  ? e.currentTarget.value
                  : undefined
              )
            }
          />

          <TextInput
            label="Создано: до"
            type="date"
            value={filters.created_to || ""}
            onChange={(e) =>
              onSetCreatedTo(
                e.currentTarget.value.trim().length > 0
                  ? e.currentTarget.value
                  : undefined
              )
            }
          />
        </SimpleGrid>

        <Divider label="Наличие полей (3-state)" />

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          <Select
            label="creator_notes"
            data={TRI_STATE_DATA as any}
            value={filters.has_creator_notes}
            onChange={(v) => onSetHasCreatorNotes((v as TriState) || "any")}
          />
          <Select
            label="system_prompt"
            data={TRI_STATE_DATA as any}
            value={filters.has_system_prompt}
            onChange={(v) => onSetHasSystemPrompt((v as TriState) || "any")}
          />
          <Select
            label="post_history_instructions"
            data={TRI_STATE_DATA as any}
            value={filters.has_post_history_instructions}
            onChange={(v) =>
              onSetHasPostHistoryInstructions((v as TriState) || "any")
            }
          />
          <Select
            label="personality"
            data={TRI_STATE_DATA as any}
            value={filters.has_personality}
            onChange={(v) => onSetHasPersonality((v as TriState) || "any")}
          />
          <Select
            label="scenario"
            data={TRI_STATE_DATA as any}
            value={filters.has_scenario}
            onChange={(v) => onSetHasScenario((v as TriState) || "any")}
          />
          <Select
            label="mes_example"
            data={TRI_STATE_DATA as any}
            value={filters.has_mes_example}
            onChange={(v) => onSetHasMesExample((v as TriState) || "any")}
          />
          <Select
            label="character_book"
            data={TRI_STATE_DATA as any}
            value={filters.has_character_book}
            onChange={(v) => onSetHasCharacterBook((v as TriState) || "any")}
          />
        </SimpleGrid>

        <Text size="sm" c="dimmed">
          Примечание: полнотекстовый поиск по description/first_mes будет
          добавлен позже через FTS5.
        </Text>
      </Stack>
    </Paper>
  );
}
