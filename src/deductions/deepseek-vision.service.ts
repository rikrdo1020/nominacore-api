import { Injectable } from '@nestjs/common';
import { ExtractImageDto } from '../common/dto/extract-image.dto';
import { extractWithVision } from '../common/deepseek-vision-client';

export type DeductionType = 'Comida' | 'Vales' | 'Otro';

export interface ExtractedDeductionResult {
  fileName: string;
  date: string | null;
  type: DeductionType | null;
  amount: number | null;
  description: string | null;
  confidence: 'high' | 'low';
  error: string | null;
}

const VALID_TYPES: DeductionType[] = ['Comida', 'Vales', 'Otro'];

const SYSTEM_PROMPT = `Analiza la imagen de un comprobante de descuento de nómina (recibo, factura, vale) y extrae la información en JSON estricto, sin texto adicional ni markdown. Formato exacto:
{"date":"YYYY-MM-DD"|null,"type":"Comida"|"Vales"|"Otro","amount":number|null,"description":string|null,"confidence":"high"|"low"}

Reglas:
- date: fecha del comprobante en formato YYYY-MM-DD. Si no es legible, null.
- type: clasifica en "Comida" (restaurantes, alimentos), "Vales" (vales o cupones), o "Otro" (cualquier otro gasto). Si no está claro, usa "Otro".
- amount: monto total, solo número, sin símbolos de moneda ni separadores de miles. Si no es legible, null.
- description: descripción breve (comercio o concepto), máximo 60 caracteres. null si no hay info útil.
- confidence: "low" si tuviste que adivinar la fecha o el monto, "high" si ambos son claramente legibles.

Responde SOLO el objeto JSON.`;

function parseContent(fileName: string, content: string): ExtractedDeductionResult {
  const parsed = JSON.parse(content);

  const type = VALID_TYPES.includes(parsed.type) ? (parsed.type as DeductionType) : 'Otro';
  const amount = typeof parsed.amount === 'number' && Number.isFinite(parsed.amount) ? parsed.amount : null;
  const date = typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null;
  const description = typeof parsed.description === 'string' ? parsed.description.slice(0, 60) : null;
  const confidence = parsed.confidence === 'high' && date && amount ? 'high' : 'low';

  return { fileName, date, type, amount, description, confidence, error: null };
}

function buildErrorResult(fileName: string, error: string): ExtractedDeductionResult {
  return { fileName, date: null, type: null, amount: null, description: null, confidence: 'low', error };
}

@Injectable()
export class DeepseekVisionService {
  extractAll(images: ExtractImageDto[]): Promise<ExtractedDeductionResult[]> {
    return extractWithVision(images, SYSTEM_PROMPT, parseContent, buildErrorResult);
  }
}
