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

const SYSTEM_PROMPT = `Analiza la imagen de un comprobante de asistencia laboral (marcaje de reloj, hoja de horario, captura de app de asistencia) y extrae la información en JSON estricto, sin texto adicional ni markdown. Formato exacto:
{"date":"YYYY-MM-DD"|null,"is_direct_entry":boolean,"entry_time":"HH:MM"|null,"exit_time":"HH:MM"|null,"direct_hours":number|null,"notes":string|null,"confidence":"high"|"low"}

Reglas:
- date: fecha del registro en formato YYYY-MM-DD. Si no es legible, null.
- Si la imagen muestra hora de entrada Y hora de salida (formato 24h HH:MM): usa is_direct_entry=false, llena entry_time y exit_time, deja direct_hours en null.
- Si la imagen solo muestra un total de horas trabajadas sin horas de entrada/salida claras: usa is_direct_entry=true, llena direct_hours (número), deja entry_time y exit_time en null.
- notes: nota breve si hay alguna anotación relevante (ej. "medio día", "permiso"), máximo 60 caracteres. null si no hay.
- confidence: "low" si tuviste que adivinar la fecha o las horas, "high" si son claramente legibles.

Responde SOLO el objeto JSON.`;

function parseContent(fileName: string, content: string): ExtractedWorkRecordResult {
  const parsed = JSON.parse(content);

  const date = typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null;
  const isDirectEntry = parsed.is_direct_entry === true;
  const entryTime = !isDirectEntry && typeof parsed.entry_time === 'string' && TIME_RE.test(parsed.entry_time) ? parsed.entry_time : null;
  const exitTime = !isDirectEntry && typeof parsed.exit_time === 'string' && TIME_RE.test(parsed.exit_time) ? parsed.exit_time : null;
  const directHours = isDirectEntry && typeof parsed.direct_hours === 'number' && Number.isFinite(parsed.direct_hours) ? parsed.direct_hours : null;
  const notes = typeof parsed.notes === 'string' ? parsed.notes.slice(0, 60) : null;

  const hasCoreFields = isDirectEntry ? directHours != null : entryTime != null && exitTime != null;
  const confidence = parsed.confidence === 'high' && date && hasCoreFields ? 'high' : 'low';

  return { fileName, date, isDirectEntry, entryTime, exitTime, directHours, notes, confidence, error: null };
}

function buildErrorResult(fileName: string, error: string): ExtractedWorkRecordResult {
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

@Injectable()
export class WorkRecordsVisionService {
  extractAll(images: ExtractImageDto[]): Promise<ExtractedWorkRecordResult[]> {
    return extractWithVision(images, SYSTEM_PROMPT, parseContent, buildErrorResult);
  }
}
