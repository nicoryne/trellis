// TODO: apply auth middleware — add `auth` from middleware/auth.ts to each route once Gabe's file is in place.
// Example: router.post('/organize', auth, async (req, res) => { ... })
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { organizeNote } from '../services/organize';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const organizeSchema = z.object({
  content: z.string().min(1).max(50_000),
});

router.post('/organize', async (req: Request, res: Response) => {
  const parsed = organizeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: parsed.error.message, retryable: false },
    });
  }
  try {
    const result = await organizeNote(parsed.data.content);
    return res.json({ data: result });
  } catch {
    return res.status(500).json({
      error: { code: 'ORGANIZE_ERROR', message: 'Organization failed', retryable: true },
    });
  }
});

router.post('/transcribe', upload.single('audio'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'No audio file provided', retryable: false },
    });
  }
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: new File([req.file.buffer], 'audio.webm', { type: req.file.mimetype }),
      model: 'whisper-1',
    });
    return res.json({ data: { transcript: transcription.text } });
  } catch {
    return res.status(500).json({
      error: { code: 'TRANSCRIPTION_ERROR', message: 'Transcription failed', retryable: true },
    });
  }
});

router.post('/vision', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'No image file provided', retryable: false },
    });
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent([
      'Extract all text from this image and provide a brief structural description. Return ONLY JSON: { "text": "extracted text", "description": "brief structure description" }',
      { inlineData: { data: req.file.buffer.toString('base64'), mimeType: req.file.mimetype } },
    ]);
    const parsed = JSON.parse(result.response.text());
    return res.json({ data: parsed });
  } catch {
    return res.status(500).json({
      error: { code: 'VISION_ERROR', message: 'Image analysis failed', retryable: true },
    });
  }
});

export default router;
