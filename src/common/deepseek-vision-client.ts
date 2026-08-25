import { InternalServerErrorException, Logger } from '@nestjs/common';
import { ExtractImageDto } from './dto/extract-image.dto';

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_VISION_MODEL = 'deepseek-v4-flash-vision-exp';
const CONCURRENCY = 3;

const logger = new Logger('DeepseekVisionClient');

type ParseContent<T> = (fileName: string, content: string) => T;
type BuildErrorResult<T> = (fileName: string, error: string) => T;

// Shared low-level DeepSeek vision caller: fetch + concurrency pool + error
// handling. Callers supply the prompt and the result-shaping functions so
// each feature (deductions, work records, ...) keeps its own extraction
// schema without duplicating the HTTP/concurrency plumbing.
export async function extractWithVision<T>(
  images: ExtractImageDto[],
  systemPrompt: string,
  parseContent: ParseContent<T>,
  buildErrorResult: BuildErrorResult<T>,
): Promise<T[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new InternalServerErrorException('IA no configurada: falta DEEPSEEK_API_KEY en el servidor');
  }

  const results: T[] = new Array(images.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < images.length) {
      const index = cursor++;
      results[index] = await extractOne(images[index], apiKey, systemPrompt, parseContent, buildErrorResult);
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, images.length) }, worker));
  return results;
}

async function extractOne<T>(
  image: ExtractImageDto,
  apiKey: string,
  systemPrompt: string,
  parseContent: ParseContent<T>,
  buildErrorResult: BuildErrorResult<T>,
): Promise<T> {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_VISION_MODEL,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${image.mimeType};base64,${image.base64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.warn(`DeepSeek ${response.status} for ${image.fileName}: ${body.slice(0, 300)}`);
      return buildErrorResult(image.fileName, `Error de IA (HTTP ${response.status})`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      return buildErrorResult(image.fileName, 'Respuesta de IA vacía');
    }

    try {
      return parseContent(image.fileName, content);
    } catch {
      return buildErrorResult(image.fileName, 'La IA no devolvió un JSON válido');
    }
  } catch (err) {
    logger.error(`Extraction failed for ${image.fileName}`, err as Error);
    return buildErrorResult(image.fileName, 'No se pudo analizar la imagen');
  }
}
