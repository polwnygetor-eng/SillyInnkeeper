import { useEffect } from "react";
import { Stack, Box, Container } from "@mantine/core";
import { useUnit } from "effector-react";
import { loadFromApiFx } from "@/features/view-settings";
import { ViewSettingsPanel } from "@/features/view-settings";
import { CardsGrid } from "@/features/cards-grid";
import {
  CardsFiltersPanel,
  applyFilters,
  loadCardsFiltersFx,
} from "@/features/cards-filters";

export function HomePage() {
  const [loadSettings, loadFilters, onApply] = useUnit([
    loadFromApiFx,
    loadCardsFiltersFx,
    applyFilters,
  ]);

  useEffect(() => {
    loadSettings();
    loadFilters();
    onApply();
  }, [loadFilters, loadSettings, onApply]);

  return (
    <Box style={{ width: "100%", minHeight: "100vh" }}>
      <Stack gap="xl" p="xl" style={{ maxWidth: "100%", width: "100%" }}>
        <Container size="xl">
          <ViewSettingsPanel />
        </Container>
        <Container size="xl">
          <CardsFiltersPanel />
        </Container>
        <CardsGrid />
      </Stack>
    </Box>
  );
}
