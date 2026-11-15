import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  events?: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    isAllDay: boolean;
    location?: string;
    categoryName?: string;
  }[];
  tasks?: {
    id: string;
    title: string;
    completed: boolean;
    dueDate?: string;
  }[];
  categories?: { id: string; name: string }[];
  userTimezone?: string;
  currentDate?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const messages = body.messages || [];

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user' || !lastMessage.content.trim()) {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    const now = body.currentDate ? new Date(body.currentDate) : new Date();
    const currentDateStr = format(now, 'yyyy-MM-dd');
    const dayOfWeek = format(now, 'EEEE');
    const userTimezone = body.userTimezone || 'UTC';

    // Focus context window to nearby events (30 days past to 45 days future) to save tokens
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const fortyFiveDaysAhead = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const relevantEvents = (body.events || [])
      .filter((e) => {
        const start = e.startDate || '';
        const end = e.endDate || e.startDate || '';
        return (
          (start >= thirtyDaysAgo && start <= fortyFiveDaysAhead) ||
          (end >= thirtyDaysAgo && start <= fortyFiveDaysAhead)
        );
      })
      .slice(0, 35);

    const eventsList = relevantEvents
      .map((e) => {
        const timeStr = e.isAllDay ? 'All Day' : `${e.startTime} - ${e.endTime}`;
        const locStr = e.location ? ` at ${e.location}` : '';
        const catStr = e.categoryName ? ` [${e.categoryName}]` : '';
        const dateRange =
          e.endDate && e.endDate !== e.startDate ? `${e.startDate} to ${e.endDate}` : e.startDate;
        return `• "${e.title}" on ${dateRange} (${timeStr})${locStr}${catStr}`;
      })
      .join('\n');

    // Format tasks for context (up to 25 tasks)
    const tasksList = (body.tasks || [])
      .slice(0, 25)
      .map((t) => {
        const status = t.completed ? '✓ Completed' : '○ Pending';
        const due = t.dueDate ? ` (Due: ${t.dueDate})` : '';
        return `• [${status}] ${t.title}${due}`;
      })
      .join('\n');

    const categoriesList = (body.categories || [])
      .map((c) => `"${c.name}" (ID: ${c.id})`)
      .join(', ');

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    const systemInstruction = `You are Dayli AI, a factual and precise personal calendar assistant for Dayli Calendar.
Current Date: ${currentDateStr} (${dayOfWeek}).
User Timezone: ${userTimezone}.

User's Visible Events on Calendar:
${eventsList || 'No scheduled events on the user\'s active calendar.'}

User's Tasks:
${tasksList || 'No tasks.'}

Available Categories:
${categoriesList || 'General'}

CRITICAL INSTRUCTIONS:
1. STRICT FACTUAL ACCURACY: ONLY refer to the events and tasks explicitly listed above.
2. NEVER invent, hallucinate, or assume any meetings, classes, or events that are not in the list above.
3. If a day has no listed events, say clearly that the user has no events scheduled for that day.
4. Format schedules cleanly grouped by day in chronological order.
5. If the user asks to schedule, plan, or create an event or task, give a warm confirmation AND attach an action block at the END of your reply using this exact markdown code block format:
\`\`\`action:create_event
{
  "title": string,
  "startDate": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "endDate": "YYYY-MM-DD",
  "endTime": "HH:mm",
  "isAllDay": boolean,
  "location": string or null,
  "categoryId": string or null
}
\`\`\`
Or for tasks:
\`\`\`action:create_task
{
  "title": string,
  "dueDate": "YYYY-MM-DD" or null,
  "categoryId": string or null
}
\`\`\`

Style Guidelines:
- Keep answers concise, clear, and easy to read.
- Use bullet points for schedules.`;

    if (apiKey) {
      // Build conversation contents for Gemini (capped to last 6 messages to preserve context and save tokens)
      const contents = [
        ...messages.slice(-6).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      ];

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

      try {
        const geminiRes = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
            },
          }),
        });

        if (geminiRes.status === 429) {
          return NextResponse.json(
            {
              reply: 'AI rate limit reached for the moment. Please wait a minute before sending another message.',
              source: 'rate_limited',
            },
            { status: 429 }
          );
        }

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const candidate = geminiData.candidates?.[0];
          const text = candidate?.content?.parts
            ?.map((p: { text?: string }) => p.text || '')
            .filter(Boolean)
            .join('') || '';

          if (text) {
            return NextResponse.json({
              reply: text,
              source: 'gemini',
            });
          }
        } else {
          const errorBody = await geminiRes.text();
          console.warn(`Gemini API returned status ${geminiRes.status}:`, errorBody);
          if (
            geminiRes.status === 429 ||
            errorBody.includes('RESOURCE_EXHAUSTED') ||
            errorBody.includes('Quota exceeded')
          ) {
            return NextResponse.json(
              {
                reply: 'AI rate limit reached for the moment. Please wait a minute before sending another message.',
                source: 'rate_limited',
              },
              { status: 429 }
            );
          }
        }
      } catch (err) {
        console.error('Gemini API call error in chat:', err);
      }
    }

    // Heuristic fallback if Gemini API key is missing or offline
    const query = lastMessage.content.toLowerCase();
    let fallbackReply = "I'm ready to help with your Dayli calendar! Ask me about your upcoming schedule, free slots, or ask me to schedule an event.";

    if (query.includes('schedule') || query.includes('today') || query.includes('event')) {
      if (body.events && body.events.length > 0) {
        const todayEvents = body.events.filter((e) => e.startDate === currentDateStr);
        if (todayEvents.length > 0) {
          fallbackReply = `You have ${todayEvents.length} event(s) scheduled for today (${currentDateStr}):\n\n` +
            todayEvents.map((e) => `• **${e.title}** (${e.isAllDay ? 'All Day' : `${e.startTime} - ${e.endTime}`})`).join('\n');
        } else {
          fallbackReply = `You have no events scheduled for today (${currentDateStr}). Your day is completely free!`;
        }
      } else {
        fallbackReply = `You currently have no events scheduled. Would you like to create one?`;
      }
    } else if (query.includes('task')) {
      if (body.tasks && body.tasks.length > 0) {
        const pending = body.tasks.filter((t) => !t.completed);
        fallbackReply = `You have ${pending.length} pending task(s):\n\n` +
          pending.map((t) => `• ${t.title}${t.dueDate ? ` (Due: ${t.dueDate})` : ''}`).join('\n');
      } else {
        fallbackReply = `You have no pending tasks right now.`;
      }
    }

    return NextResponse.json({
      reply: fallbackReply,
      source: 'local',
    });
  } catch (err: unknown) {
    console.error('Error in chat API route:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

