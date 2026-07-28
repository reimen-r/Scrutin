import { GoogleGenerativeAI } from '@google/generative-ai';
import { ContractType, AnalysisResult, TSJExtractionResult } from '../types/contract';
import { buildAnalysisPrompt, buildTSJExtractionPrompt } from '../utils/prompts';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(API_KEY);

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

// Simple in-memory cache for API responses
const analysisCache = new Map<string, { result: AnalysisResult; timestamp: number }>();
const tsjCache = new Map<string, { result: TSJExtractionResult; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes
const MAX_CACHE_SIZE = 50;

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function getCachedAnalysis(key: string): AnalysisResult | null {
  const cached = analysisCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  analysisCache.delete(key);
  return null;
}

function setCachedAnalysis(key: string, result: AnalysisResult): void {
  if (analysisCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = analysisCache.keys().next().value;
    if (oldestKey) analysisCache.delete(oldestKey);
  }
  analysisCache.set(key, { result, timestamp: Date.now() });
}

function getCachedTSJ(key: string): TSJExtractionResult | null {
  const cached = tsjCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  tsjCache.delete(key);
  return null;
}

function setCachedTSJ(key: string, result: TSJExtractionResult): void {
  if (tsjCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = tsjCache.keys().next().value;
    if (oldestKey) tsjCache.delete(oldestKey);
  }
  tsjCache.set(key, { result, timestamp: Date.now() });
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const MODEL_RETRY_DELAYS = [1000, 2000, 3000];

async function tryAnalyzeWithModel(
  modelName: string,
  contractType: ContractType,
  imageBase64: string,
  mimeType: string,
): Promise<AnalysisResult | null> {
  for (let attempt = 0; attempt < MODEL_RETRY_DELAYS.length; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });
      const prompt = buildAnalysisPrompt(contractType);

      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { mimeType, data: imageBase64 } },
      ]);

      const parsed = JSON.parse(result.response.text());

      return { 
        contractType, 
        text: '', 
        report: parsed.report || 'No se pudo generar el reporte.', 
        riskLevel: parsed.riskLevel || 'bajo' 
      };
    } catch (e: any) {
      const isQuota = e?.status === 429 || e?.message?.includes('429') || e?.message?.includes('RATE_LIMIT');
      const isAuth = e?.status === 400 || e?.message?.includes('API_KEY');
      const isServer = e?.status === 500 || e?.status === 503;

      if (isAuth) {
        throw new Error(
          'La clave de API de Gemini no es válida. Verifica que EXPO_PUBLIC_GEMINI_API_KEY en .env sea correcta.',
        );
      }

      if (isQuota || isServer) {
        console.warn(`Intento ${attempt + 1} falló para ${modelName} (cuota/servidor), reintentando...`);
        if (attempt < MODEL_RETRY_DELAYS.length - 1) {
          await sleep(MODEL_RETRY_DELAYS[attempt]);
          continue;
        }
        return null;
      }

      console.warn(`Error en ${modelName} (intento ${attempt + 1}):`, e?.message);
      if (attempt < MODEL_RETRY_DELAYS.length - 1) {
        await sleep(MODEL_RETRY_DELAYS[attempt]);
        continue;
      }
      return null;
    }
  }
  return null;
}

export async function analyzeContractImage(
  contractType: ContractType,
  imageBase64: string,
  mimeType: string,
): Promise<AnalysisResult> {
  // Check cache first
  const cacheKey = `${contractType}-${simpleHash(imageBase64)}`;
  const cached = getCachedAnalysis(cacheKey);
  if (cached) {
    return cached;
  }

  const errors: string[] = [];

  for (const modelName of MODELS) {
    try {
      const result = await tryAnalyzeWithModel(modelName, contractType, imageBase64, mimeType);
      if (result) {
        setCachedAnalysis(cacheKey, result);
        return result;
      }
      errors.push(`${modelName} no disponible`);
    } catch (e: any) {
      throw e;
    }
  }

  throw new Error(
    'No pudimos analizar el documento con ningún modelo. ' +
    'Verifica tu conexión a internet y que el documento sea legible. ' +
    'Si el problema persiste, la clave API puede haber excedido su cuota.',
  );
}

async function tryExtractTSJWithModel(
  modelName: string,
  imageBase64: string,
  mimeType: string,
): Promise<TSJExtractionResult | null> {
  for (let attempt = 0; attempt < MODEL_RETRY_DELAYS.length; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });
      const prompt = buildTSJExtractionPrompt();

      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { mimeType, data: imageBase64 } },
      ]);

      const parsed = JSON.parse(result.response.text());
      return {
        expediente: parsed.expediente || 'No especificado',
        tipoRecurso: parsed.tipoRecurso || 'No especificado',
        magistradoPonente: parsed.magistradoPonente || 'No especificado',
        decision: parsed.decision || 'No especificado',
        fecha: parsed.fecha || 'No especificado',
        votacion: parsed.votacion || 'No especificado',
        partes: parsed.partes || 'No especificado',
        rawReport: parsed.rawReport || 'No especificado',
      };
    } catch (e: any) {
      const isQuota = e?.status === 429 || e?.message?.includes('429') || e?.message?.includes('RATE_LIMIT');
      const isAuth = e?.status === 400 || e?.message?.includes('API_KEY');
      const isServer = e?.status === 500 || e?.status === 503;

      if (isAuth) {
        throw new Error(
          'La clave de API de Gemini no es válida. Verifica que EXPO_PUBLIC_GEMINI_API_KEY en .env sea correcta.',
        );
      }

      if (isQuota || isServer) {
        console.warn(`Intento ${attempt + 1} falló para ${modelName} (cuota/servidor), reintentando...`);
        if (attempt < MODEL_RETRY_DELAYS.length - 1) {
          await sleep(MODEL_RETRY_DELAYS[attempt]);
          continue;
        }
        return null;
      }

      console.warn(`Error en ${modelName} (intento ${attempt + 1}):`, e?.message);
      if (attempt < MODEL_RETRY_DELAYS.length - 1) {
        await sleep(MODEL_RETRY_DELAYS[attempt]);
        continue;
      }
      return null;
    }
  }
  return null;
}

export async function analyzeTSJDocument(
  imageBase64: string,
  mimeType: string,
): Promise<TSJExtractionResult> {
  // Check cache first
  const cacheKey = `tsj-${simpleHash(imageBase64)}`;
  const cached = getCachedTSJ(cacheKey);
  if (cached) {
    return cached;
  }

  for (const modelName of MODELS) {
    try {
      const result = await tryExtractTSJWithModel(modelName, imageBase64, mimeType);
      if (result) {
        setCachedTSJ(cacheKey, result);
        return result;
      }
    } catch (e: any) {
      throw e;
    }
  }

  throw new Error(
    'No pudimos procesar la sentencia con ningún modelo. ' +
    'Verifica tu conexión a internet y que el documento sea legible.',
  );
}
