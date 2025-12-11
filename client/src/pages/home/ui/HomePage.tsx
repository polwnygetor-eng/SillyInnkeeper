import { useEffect, useState } from "react";
import { Stack, Box, Container, Drawer, Button, Group } from "@mantine/core";
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
  const [filtersOpened, setFiltersOpened] = useState(false);

  useEffect(() => {
    loadSettings();
    loadFilters();
    onApply();
  }, [loadFilters, loadSettings, onApply]);

  return (
    <Box style={{ width: "100%", minHeight: "100vh" }}>
      <Stack gap="xl" p="xl" style={{ maxWidth: "100%", width: "100%" }}>
        <Container size="xl">
          <Group justify="space-between" align="flex-start">
            <ViewSettingsPanel />
            <Button
              variant="light"
              onClick={() => setFiltersOpened(true)}
              style={{ whiteSpace: "nowrap" }}
            >
              Фильтры
            </Button>
          </Group>
        </Container>
        <CardsGrid />
      </Stack>

      <Drawer
        opened={filtersOpened}
        onClose={() => setFiltersOpened(false)}
        position="right"
        size="md"
        title="Фильтры"
        offset={10}
        radius="md"
        // overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <CardsFiltersPanel />
      </Drawer>
    </Box>
  );
}
