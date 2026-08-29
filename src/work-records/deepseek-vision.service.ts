import { Injectable } from '@nestjs/common';
import { ExtractImageDto } from '../common/dto/extract-image.dto';
import { extractWithVision } from '../common/deepseek-vision-client';

export interface ExtractedWorkRecordResult {
  fileName: string;
  date: string | null;
  isDirectEntry: boolean;
  entryTime: string | null;
  exitTime: string | null;
  directHours: number | null;
  notes: string | null;
  confidence: 'high' | 'low';
  error: string | null;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const SYSTEM_PROMPT = `Analiza la imagen de un registro de asistencia laboral y devuelve JSON estricto, sin texto adicional ni markdown.

La imagen puede ser:
- Una PLANILLA QUINCENAL: una tabla con UNA FILA POR DÍA. Columnas relevantes: "DÍA" (la fecha) y "TURNO" (hora de entrada y hora de salida). Puede tener otras columnas (COLABORADOR, REGULAR, DOMINGO, COMIDA, BEBIDA, AUS, TAR, EXTRA, TOTAL) que debes IGNORAR por completo, incluido el nombre del colaborador.
- Un comprobante individual (marcaje de reloj, captura de app de asistencia, hoja suelta).

El documento PUEDE ESTAR ESCRITO A MANO. Interpreta la caligrafía lo mejor posible y baja la confianza cuando dudes.

Formato de salida EXACTO:
{"records":[{"date":"YYYY-MM-DD"|null,"is_direct_entry":boolean,"entry_time":"HH:MM"|null,"exit_time":"HH:MM"|null,"direct_hours":number|null,"notes":string|null,"confidence":"high"|"low"}]}

Reglas generales:
- Devuelve un objeto dentro de "records" por CADA fila de datos con información de asistencia. Omite encabezados, filas de totales y filas vacías.
- Si es un comprobante individual, "records" tendrá un solo objeto.
- Si no puedes leer ninguna fila, devuelve {"records":[]}.

Fechas (columna "DÍA"):
- Un valor tipo "13-ago-26" significa 13 de agosto de 2026 -> "2026-08-13".
- Meses abreviados en español: ene, feb, mar, abr, may, jun, jul, ago, sep (o set), oct, nov, dic.
- Un año de dos dígitos "26" -> 2026.
- Si la fecha no es legible, "date": null.

Horas (columna "TURNO" = entrada y salida, p. ej. "3:30  12:50", "3:30 - 1:01", "7:00 4:00"):
- El primer valor es la ENTRADA, el segundo es la SALIDA. Usa formato 24h "HH:MM".
- NADIE entra de madrugada. La entrada más temprana posible son las 07:00. Para convertir la entrada a 24h: si la hora escrita es 1–6, es PM (suma 12 -> 13:00–18:00); si es 7–11, es AM tal cual; si es 12, es mediodía (12:00).
- La SALIDA siempre ocurre DESPUÉS de la entrada y puede pasar de la medianoche. Convierte la salida a 24h; si el resultado no queda después de la entrada, es la madrugada del día siguiente: hora escrita 1–6 -> 01:00–06:00; 12 -> 00:00; 7–11 -> AM.
- Ejemplo: "3:30 - 1:01" -> entry_time "15:30", exit_time "01:01".
- Para filas con entrada y salida usa SIEMPRE is_direct_entry=false y direct_hours=null.

Horas directas:
- Solo si una fila muestra únicamente un total de horas (sin entrada/salida claras): is_direct_entry=true, direct_hours=número, entry_time y exit_time en null.

Otros campos:
- notes: nota breve solo si la fila tiene una anotación relevante (ej. "medio día", "permiso"), máximo 60 caracteres. null si no hay.
- confidence: "low" si tuviste que adivinar la fecha o las horas (frecuente con letra manuscrita), "high" si son claramente legibles.

Responde SOLO el objeto JSON.`;

function parseRecord(fileName: string, raw: Record<string, unknown>): ExtractedWorkRecordResult {
  const date =
    typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : null;
  const isDirectEntry = raw.is_direct_entry === true;
  const entryTime =
    !isDirectEntry && typeof raw.entry_time === 'string' && TIME_RE.test(raw.entry_time)
      ? raw.entry_time
      : null;
  const exitTime =
    !isDirectEntry && typeof raw.exit_time === 'string' && TIME_RE.test(raw.exit_time)
      ? raw.exit_time
      : null;
  const directHours =
    isDirectEntry && typeof raw.direct_hours === 'number' && Number.isFinite(raw.direct_hours)
      ? raw.direct_hours
      : null;
  const notes = typeof raw.notes === 'string' ? raw.notes.slice(0, 60) : null;

  const hasCoreFields = isDirectEntry ? directHours != null : entryTime != null && exitTime != null;
  const confidence = raw.confidence === 'high' && date && hasCoreFields ? 'high' : 'low';

  return { fileName, date, isDirectEntry, entryTime, exitTime, directHours, notes, confidence, error: null };
}

// A single planilla image yields many day-rows, so parseContent returns an
// array; the shared vision client keeps one array per image and the service
// flattens them into the flat list the /extract endpoint has always returned.
function parseContent(fileName: string, content: string): ExtractedWorkRecordResult[] {
  const parsed = JSON.parse(content);

  const rawRecords: unknown[] = Array.isArray(parsed?.records)
    ? parsed.records
    : Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
        ? [parsed]
        : [];

  const records = rawRecords
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map((r) => parseRecord(fileName, r));

  if (records.length === 0) {
    return [buildOne(fileName, 'No se detectaron filas de asistencia en el documento')];
  }
  return records;
}

function buildOne(fileName: string, error: string): ExtractedWorkRecordResult {
  return {
    fileName,
    date: null,
    isDirectEntry: false,
    entryTime: null,
    exitTime: null,
    directHours: null,
    notes: null,
    confidence: 'low',
    error,
  };
}

function buildErrorResult(fileName: string, error: string): ExtractedWorkRecordResult[] {
  return [buildOne(fileName, error)];
}

@Injectable()
export class WorkRecordsVisionService {
  async extractAll(images: ExtractImageDto[]): Promise<ExtractedWorkRecordResult[]> {
    const groups = await extractWithVision<ExtractedWorkRecordResult[]>(
      images,
      SYSTEM_PROMPT,
      parseContent,
      buildErrorResult,
    );
    return groups.flat();
  }
}
