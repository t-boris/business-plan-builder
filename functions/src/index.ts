import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { GoogleGenAI } from '@google/genai';

// Initialize Firebase Admin
initializeApp();

// Secret definitions — resolved at runtime by Cloud Functions
const geminiApiKey = defineSecret('GEMINI_API_KEY');
const perplexityApiKey = defineSecret('PERPLEXITY_API_KEY');

// ---------------------------------------------------------------------------
// Gemini model used by all Gemini endpoints
// ---------------------------------------------------------------------------
const GEMINI_MODEL = 'gemini-3-flash-preview';

// ---------------------------------------------------------------------------
// Rate limiting — simple in-memory map, 30 requests per minute per UID
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

interface RateEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateEntry>();

// Clean up expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [uid, entry] of rateLimitMap) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(uid);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

/**
 * Check rate limit for a given UID. Returns true if the request is allowed.
 */
function checkRateLimit(uid: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(uid);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(uid, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}

// ---------------------------------------------------------------------------
// Auth verification helper
// ---------------------------------------------------------------------------
interface AuthResult {
  uid: string;
}

async function verifyAuth(authHeader: string | undefined): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('UNAUTHENTICATED');
  }

  const token = authHeader.split('Bearer ')[1];
  if (!token) {
    throw new Error('UNAUTHENTICATED');
  }

  const decoded = await getAuth().verifyIdToken(token);
  return { uid: decoded.uid };
}

// ---------------------------------------------------------------------------
// CORS origins
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://my-business-planning.web.app',
  'https://my-business-planning.firebaseapp.com',
];

// ---------------------------------------------------------------------------
// Endpoint: POST /aiGeminiGenerate
// Body: { prompt: string, systemInstruction: string }
// Returns: { text: string }
// ---------------------------------------------------------------------------
export const aiGeminiGenerate = onRequest(
  {
    timeoutSeconds: 120,
    cors: ALLOWED_ORIGINS,
    secrets: [geminiApiKey],
  },
  async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Auth
      const { uid } = await verifyAuth(req.headers.authorization);

      // Rate limit
      if (!checkRateLimit(uid)) {
        res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
        return;
      }

      // Validate body
      const { prompt, systemInstruction } = req.body as {
        prompt?: string;
        systemInstruction?: string;
      };

      if (!prompt || !systemInstruction) {
        res.status(400).json({ error: 'Missing required fields: prompt, systemInstruction' });
        return;
      }

      // Call Gemini
      const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 1.0,
          maxOutputTokens: 8192,
        },
      });

      res.status(200).json({ text: response.text ?? '' });
    } catch (error: unknown) {
      handleError(res, error, 'aiGeminiGenerate');
    }
  },
);

// ---------------------------------------------------------------------------
// Endpoint: POST /aiGeminiStructured
// Body: { prompt: string, systemInstruction: string, jsonSchema: object }
// Returns: { data: object }
// ---------------------------------------------------------------------------
export const aiGeminiStructured = onRequest(
  {
    timeoutSeconds: 120,
    cors: ALLOWED_ORIGINS,
    secrets: [geminiApiKey],
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { uid } = await verifyAuth(req.headers.authorization);

      if (!checkRateLimit(uid)) {
        res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
        return;
      }

      const { prompt, systemInstruction, jsonSchema } = req.body as {
        prompt?: string;
        systemInstruction?: string;
        jsonSchema?: object;
      };

      if (!prompt || !systemInstruction || !jsonSchema) {
        res.status(400).json({
          error: 'Missing required fields: prompt, systemInstruction, jsonSchema',
        });
        return;
      }

      const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 1.0,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
          responseSchema: jsonSchema,
        },
      });

      const data: unknown = JSON.parse(response.text ?? '{}');
      res.status(200).json({ data });
    } catch (error: unknown) {
      handleError(res, error, 'aiGeminiStructured');
    }
  },
);

// ---------------------------------------------------------------------------
// Endpoint: POST /aiPerplexitySearch
// Body: { query: string }
// Returns: { content: string, citations: string[] }
// ---------------------------------------------------------------------------
export const aiPerplexitySearch = onRequest(
  {
    timeoutSeconds: 120,
    cors: ALLOWED_ORIGINS,
    secrets: [perplexityApiKey],
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { uid } = await verifyAuth(req.headers.authorization);

      if (!checkRateLimit(uid)) {
        res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
        return;
      }

      const { query } = req.body as { query?: string };

      if (!query) {
        res.status(400).json({ error: 'Missing required field: query' });
        return;
      }

      // Call Perplexity API via native fetch
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${perplexityApiKey.value()}`,
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content:
                'You are a market research analyst. Return factual demographic and market data with sources. Be precise and data-driven.',
            },
            {
              role: 'user',
              content: query,
            },
          ],
        }),
      });

      if (!perplexityResponse.ok) {
        const errorText = await perplexityResponse.text();
        if (perplexityResponse.status === 429) {
          console.error('[aiPerplexitySearch] Perplexity rate limited');
          res.status(429).json({ error: 'Perplexity rate limit reached. Please wait a moment.' });
          return;
        }
        console.error('[aiPerplexitySearch] Perplexity error', {
          status: perplexityResponse.status,
          error: errorText,
        });
        res.status(502).json({ error: 'Upstream API error' });
        return;
      }

      interface PerplexityResponse {
        choices: { message: { content: string } }[];
        citations?: string[];
      }

      const data = (await perplexityResponse.json()) as PerplexityResponse;
      const content = data.choices?.[0]?.message?.content ?? '';
      const citations = data.citations ?? [];

      res.status(200).json({ content, citations });
    } catch (error: unknown) {
      handleError(res, error, 'aiPerplexitySearch');
    }
  },
);

// ---------------------------------------------------------------------------
// Shared error handler
// ---------------------------------------------------------------------------
function handleError(
  res: { status: (code: number) => { json: (body: unknown) => void } },
  error: unknown,
  endpoint: string,
): void {
  if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (error instanceof Error && error.message?.includes('429')) {
    console.error(`[${endpoint}] Upstream rate limit`, error.message);
    res.status(429).json({ error: 'Rate limit reached. Please wait a moment.' });
    return;
  }

  console.error(`[${endpoint}] Unexpected error`, error);
  res.status(500).json({ error: 'Internal server error' });
}
