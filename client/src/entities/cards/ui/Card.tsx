import {
  Card as MantineCard,
  Image,
  Text,
  Stack,
  Group,
  Badge,
} from "@mantine/core";
import { useUnit } from "effector-react";
import type { CardListItem } from "@/shared/types/cards";
import { $isCensored } from "@/features/view-settings";

interface CardProps {
  card: CardListItem;
}

export function Card({ card }: CardProps) {
  const [isCensored] = useUnit([$isCensored]);

  return (
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
      <MantineCard.Section>
        <Image
          src={card.avatar_url}
          alt={card.name || "Миниатюра карточки"}
          height={370}
          width={300}
          fit="cover"
          loading="lazy"
          style={{
            filter: isCensored ? "blur(25px)" : "none",
            transition: "filter 0.3s ease",
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
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
  );
}
