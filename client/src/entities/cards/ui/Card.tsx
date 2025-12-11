import { useState } from "react";
import {
  Card as MantineCard,
  Image,
  Text,
  Stack,
  Group,
  Badge,
  Modal,
  ActionIcon,
  Box,
} from "@mantine/core";
import { useUnit } from "effector-react";
import type { CardListItem } from "@/shared/types/cards";
import { $isCensored } from "@/features/view-settings";

interface CardProps {
  card: CardListItem;
}

export function Card({ card }: CardProps) {
  const [isCensored] = useUnit([$isCensored]);
  const [opened, setOpened] = useState(false);

  return (
    <>
      <MantineCard
        shadow="sm"
        padding="md"
        radius="md"
        withBorder
        style={{
          width: "300px",
          height: "520px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <MantineCard.Section style={{ position: "relative" }}>
          <Image
            src={card.avatar_url}
            alt={card.name || "Миниатюра карточки"}
            height={370}
            width={300}
            fit="cover"
            loading="lazy"
            style={{
              filter: isCensored ? "blur(18px)" : "none",
              transition: "filter 0.3s ease",
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
          <ActionIcon
            variant="filled"
            color="white"
            size="lg"
            radius="md"
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              zIndex: 10,
              opacity: 0.8,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOpened(true);
            }}
            title="Открыть в полный экран"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </ActionIcon>
        </MantineCard.Section>

        <Stack gap="xs" mt="md" style={{ flex: 1, overflow: "hidden" }}>
          <Text fw={500} size="lg" lineClamp={1}>
            {card.name || "Без названия"}
          </Text>

          {card.creator && (
            <Text size="sm" c="dimmed" lineClamp={1}>
              Создатель: {card.creator}
            </Text>
          )}

          {card.tags && card.tags.length > 0 && (
            <Group gap="xs" mt="auto">
              {card.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} size="sm" variant="light">
                  {tag}
                </Badge>
              ))}
              {card.tags.length > 3 && (
                <Badge size="sm" variant="light" color="gray">
                  +{card.tags.length - 3}
                </Badge>
              )}
            </Group>
          )}
        </Stack>
      </MantineCard>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        size="xl"
        centered
        title={card.name || "Изображение карточки"}
      >
        <Box
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Image
            src={`/api/image/${card.id}`}
            alt={card.name || "Изображение карточки"}
            fit="contain"
            style={{
              maxWidth: "100%",
              maxHeight: "80vh",
              filter: isCensored ? "blur(12px)" : "none",
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        </Box>
      </Modal>
    </>
  );
}
