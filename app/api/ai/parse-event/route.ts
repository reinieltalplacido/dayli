import { NextRequest, NextResponse } from 'next/server';
import { format, addDays, parse, isValid, addHours } from 'date-fns';

interface CategoryInput {
  id: string;
  name: string;
}

interface ParseEventRequest {
  prompt: string;
  categories?: CategoryInput[];
  userTimezone?: string;
  currentDate?: string;
}

interface ParsedEventOutput {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isAllDay: boolean;
  location?: string;
  description?: string;
  categoryId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ParseEventRequest = await req.json();
    const prompt = (body.prompt || '').trim();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const categories = body.categories || [];
    const userTimezone = body.userTimezone || 'UTC';
    const now = body.currentDate ? new Date(body.currentDate) : new Date();
    const currentDateStr = format(now, 'yyyy-MM-dd');
    const dayOfWeek = format(now, 'EEEE');

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    // If Gemini API Key is available, call gemini-2.0-flash
    if (apiKey) {
      try {
        const categoriesPrompt = categories.length > 0
          ? categories.map((c) => `ID: "${c.id}", Name: "${c.name}"`).join(' | ')
          : 'None';

        const systemPrompt = `You are a calendar assistant for Dayli.
Today is ${currentDateStr} (${dayOfWeek}).
The user's local timezone is: ${userTimezone}.
Available calendar categories: [${categoriesPrompt}].

Given the user's natural language event request, parse it into a structured event JSON object.
Return ONLY a valid JSON object matching this schema:
{
  "title": string, // Clean title without the date, time, or location prepositions
  "startDate": "YYYY-MM-DD", // Resolved date
  "startTime": "HH:mm", // 24-hour time format (e.g. "19:00" for 7 PM). Default to "09:00" if no time mentioned
  "endDate": "YYYY-MM-DD", // Resolved end date
  "endTime": "HH:mm", // 24-hour time format. If duration not mentioned, default to 1 hour after startTime
  "isAllDay": boolean, // true if user said "all day" or just mentioned a date without time
  "location": string or null, // Location, room, address, or video call link if mentioned
  "description": string or null, // Any extra notes or agenda items mentioned
  "categoryId": string or null // Choose the best matching category ID from the available categories list, or null if none fit
}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: prompt }],
                },
              ],
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.1,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const candidateText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (candidateText) {
            const parsed: ParsedEventOutput = JSON.parse(candidateText);

            // Sanitize and validate
            const sanitized: ParsedEventOutput = {
              title: parsed.title?.trim() || prompt,
              startDate: parsed.startDate || currentDateStr,
              startTime: parsed.startTime || '09:00',
              endDate: parsed.endDate || parsed.startDate || currentDateStr,
              endTime: parsed.endTime || '10:00',
              isAllDay: Boolean(parsed.isAllDay),
              location: parsed.location || undefined,
              description: parsed.description || undefined,
              categoryId: parsed.categoryId || categories[0]?.id || undefined,
            };

            return NextResponse.json({
              success: true,
              event: sanitized,
              source: 'gemini',
              model: 'gemini-3-flash-preview',
            });
          }
        } else {
          console.warn(
            'Gemini API error, falling back to local heuristic parser:',
            await geminiRes.text()
          );
        }
      } catch (geminiErr) {
        console.warn('Gemini call failed, using local parser:', geminiErr);
      }
    }

    // Fallback Local Heuristic Parser (0 API calls, always works)
    const fallbackParsed = fallbackParse(prompt, now, categories);
    return NextResponse.json({
      success: true,
      event: fallbackParsed,
      source: 'local',
      hasApiKey: Boolean(apiKey),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to parse event', details: message },
      { status: 500 }
    );
  }
}

/**
 * Intelligent local fallback parser for when API key is missing or offline
 */
function fallbackParse(
  rawPrompt: string,
  baseDate: Date,
  categories: CategoryInput[]
): ParsedEventOutput {
  let prompt = rawPrompt.trim();
  let startDate = format(baseDate, 'yyyy-MM-dd');
  let startTime = '09:00';
  let endTime = '10:00';
  let isAllDay = false;
  let location: string | undefined = undefined;

  // 1. Detect Location (e.g. "at Starbucks", "in Hall 102", "on Zoom")
  const locationMatch = prompt.match(/\b(?:at|in|via)\s+([A-Z0-9][A-Za-z0-9\s.,'#&-]+)(?:\s+(?:tomorrow|today|on|at|from)\b|$)/i) ||
                        prompt.match(/\b(?:at|in|via)\s+([A-Za-z0-9\s.,'#&-]+)$/i);
  if (locationMatch && locationMatch[1]) {
    const locCandidate = locationMatch[1].trim();
    // make sure it's not a time like "at 7pm"
    if (!locCandidate.match(/^\d{1,2}(?::\d{2})?\s*(?:am|pm)?$/i)) {
      location = locCandidate;
      prompt = prompt.replace(locationMatch[0], ' ').trim();
    }
  }

  // 2. Detect Date
  const lower = prompt.toLowerCase();
  if (lower.includes('tomorrow')) {
    startDate = format(addDays(baseDate, 1), 'yyyy-MM-dd');
    prompt = prompt.replace(/\btomorrow\b/gi, '').trim();
  } else if (lower.includes('today')) {
    startDate = format(baseDate, 'yyyy-MM-dd');
    prompt = prompt.replace(/\btoday\b/gi, '').trim();
  } else if (lower.includes('day after tomorrow')) {
    startDate = format(addDays(baseDate, 2), 'yyyy-MM-dd');
    prompt = prompt.replace(/\bday after tomorrow\b/gi, '').trim();
  } else {
    // Check for days of week (e.g. "on Monday", "this Friday", "next Tuesday")
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < 7; i++) {
      const dayName = daysOfWeek[i];
      const match = new RegExp(`\\b(?:on\\s+|this\\s+|next\\s+)?(${dayName})\\b`, 'i').exec(prompt);
      if (match) {
        const targetDay = i;
        const currentDay = baseDate.getDay();
        let daysToAdd = (targetDay - currentDay + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // next week if same day
        startDate = format(addDays(baseDate, daysToAdd), 'yyyy-MM-dd');
        prompt = prompt.replace(match[0], '').trim();
        break;
      }
    }
  }

  // 3. Detect Time Range or Single Time (e.g. "7pm", "7:30pm", "14:00", "2pm to 4pm", "2-4pm")
  const rangeMatch = prompt.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-|until)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
  if (rangeMatch) {
    startTime = parseTime(rangeMatch[1]);
    endTime = parseTime(rangeMatch[2]);
    prompt = prompt.replace(rangeMatch[0], '').trim();
  } else {
    const singleTimeMatch = prompt.match(/\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i) ||
                             prompt.match(/\bat\s+(\d{1,2})\b/i);
    if (singleTimeMatch) {
      startTime = parseTime(singleTimeMatch[1]);
      const [h, m] = startTime.split(':').map(Number);
      const endH = (h + 1) % 24;
      endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      prompt = prompt.replace(singleTimeMatch[0], '').trim();
    } else if (lower.includes('all day')) {
      isAllDay = true;
      prompt = prompt.replace(/\ball day\b/gi, '').trim();
    }
  }

  // 4. Clean up title
  let title = prompt
    .replace(/\s+/g, ' ')
    .replace(/^[,.\s-]+|[,.\s-]+$/g, '')
    .trim();

  if (!title) {
    title = 'New Event';
  }

  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);

  // 5. Suggest Category by keyword matching
  let suggestedCategoryId = categories[0]?.id;
  const titleLower = title.toLowerCase();

  for (const cat of categories) {
    const cName = cat.name.toLowerCase();
    if (cName.includes('meet') && (titleLower.includes('meet') || titleLower.includes('sync') || titleLower.includes('call') || titleLower.includes('interview'))) {
      suggestedCategoryId = cat.id;
      break;
    }
    if (cName.includes('school') && (titleLower.includes('class') || titleLower.includes('lecture') || titleLower.includes('exam') || titleLower.includes('study') || titleLower.includes('assignment'))) {
      suggestedCategoryId = cat.id;
      break;
    }
    if (cName.includes('deadline') && (titleLower.includes('due') || titleLower.includes('deadline') || titleLower.includes('submit') || titleLower.includes('finish'))) {
      suggestedCategoryId = cat.id;
      break;
    }
    if (cName.includes('important') && (titleLower.includes('doctor') || titleLower.includes('dentist') || titleLower.includes('flight') || titleLower.includes('urgent'))) {
      suggestedCategoryId = cat.id;
      break;
    }
  }

  return {
    title,
    startDate,
    startTime,
    endDate: startDate,
    endTime,
    isAllDay,
    location,
    categoryId: suggestedCategoryId,
  };
}

function parseTime(timeStr: string): string {
  const clean = timeStr.trim().toLowerCase();
  const isPM = clean.includes('pm');
  const isAM = clean.includes('am');
  const numbersOnly = clean.replace(/[^\d:]/g, '');

  let hours = 0;
  let minutes = 0;

  if (numbersOnly.includes(':')) {
    const parts = numbersOnly.split(':');
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10) || 0;
  } else {
    hours = parseInt(numbersOnly, 10);
  }

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

