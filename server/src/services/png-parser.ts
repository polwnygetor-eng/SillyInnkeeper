import { readFileSync } from "node:fs";

export interface ParsedCardData {
  data: unknown;
  spec_version: "2.0" | "3.0";
}

/**
 * Парсит метаданные карточки из PNG файла
 * Читает текстовые чанки tEXt без полного декодирования изображения
 * @param filePath Путь к PNG файлу
 * @returns Парсированные данные карточки или null в случае ошибки
 */
export function parsePngMetadata(filePath: string): ParsedCardData | null {
  try {
    // Читаем файл в буфер
    const buffer = readFileSync(filePath);

    // Проверяем PNG сигнатуру (первые 8 байт: 89 50 4E 47 0D 0A 1A 0A)
    if (
      buffer.length < 8 ||
      buffer.toString("hex", 0, 8) !== "89504e470d0a1a0a"
    ) {
      console.error(`Файл ${filePath} не является валидным PNG`);
      return null;
    }

    // Парсим чанки, начиная с позиции 8 (после сигнатуры)
    let position = 8;

    while (position < buffer.length - 12) {
      // Читаем длину чанка (4 байта, big-endian)
      const chunkLength = buffer.readUInt32BE(position);
      position += 4;

      // Читаем тип чанка (4 байта)
      const chunkType = buffer.toString("ascii", position, position + 4);
      position += 4;

      // Если это чанк tEXt
      if (chunkType === "tEXt") {
        // Проверяем, что у нас достаточно данных для чтения чанка
        if (buffer.length < position + chunkLength + 4) {
          console.error(
            `Недостаточно данных для чтения чанка tEXt в файле ${filePath}`
          );
          return null;
        }

        // Читаем данные чанка
        const chunkData = buffer.slice(position, position + chunkLength);

        // В чанке tEXt формат: keyword (null-terminated) + text
        const nullIndex = chunkData.indexOf(0);
        if (nullIndex > 0 && nullIndex < chunkData.length - 1) {
          const keyword = chunkData.slice(0, nullIndex).toString("ascii");
          const text = chunkData.slice(nullIndex + 1).toString("latin1");

          // Ищем чанк с ключевым словом "chara"
          if (keyword === "chara") {
            try {
              // Декодируем Base64 содержимое
              const decodedData = Buffer.from(text, "base64").toString("utf-8");
              const cardData = JSON.parse(decodedData);

              // Определяем версию спецификации
              const specVersion: "2.0" | "3.0" =
                cardData.spec === "chara_card_v3" ? "3.0" : "2.0";

              return {
                data: cardData,
                spec_version: specVersion,
              };
            } catch (error) {
              console.error(
                `Ошибка при декодировании данных карточки из ${filePath}:`,
                error
              );
              return null;
            }
          }
        }

        // Пропускаем CRC (4 байта) и переходим к следующему чанку
        position += chunkLength + 4;
      } else if (chunkType === "IEND") {
        // Конец файла - чанк chara не найден
        break;
      } else {
        // Пропускаем другие чанки (данные + CRC)
        if (buffer.length >= position + chunkLength + 4) {
          position += chunkLength + 4;
        } else {
          // Недостаточно данных
          break;
        }
      }
    }

    // Чанк chara не найден
    return null;
  } catch (error) {
    console.error(`Ошибка при парсинге PNG файла ${filePath}:`, error);
    return null;
  }
}
