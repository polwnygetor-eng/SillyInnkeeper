import { useEffect } from "react";
import { Stack, Box, Container } from "@mantine/core";
import { useUnit } from "effector-react";
import { loadCardsFx } from "@/entities/cards";
import { loadFromApiFx } from "@/features/view-settings";
import { ViewSettingsPanel } from "@/features/view-settings";
import { CardsGrid } from "@/features/cards-grid";

export function HomePage() {
  const [loadCards, loadSettings] = useUnit([loadCardsFx, loadFromApiFx]);

  useEffect(() => {
    loadSettings();
    loadCards();
  }, [loadCards, loadSettings]);

  return (
    <Box style={{ width: "100%", minHeight: "100vh" }}>
      <Stack gap="xl" p="xl" style={{ maxWidth: "100%", width: "100%" }}>
        <Container size="xl">
          <ViewSettingsPanel />
        </Container>
        <CardsGrid />
      </Stack>
    </Box>
  );
}
