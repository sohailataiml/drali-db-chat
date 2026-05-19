import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { Client } from 'pg';

const DB_URL = process.env.DATABASE_URL!;

async function runQuery(sql: string): Promise<object[]> {
  const pg = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  await pg.connect();
  try {
    const result = await pg.query(sql);
    return result.rows;
  } finally {
    await pg.end();
  }
}

const SYSTEM_PROMPT = `You are a helpful CRM database assistant for Dr. Ali Plastic Surgery & Amae MedSpa.
You have read-only access to a PostgreSQL CRM database with the following tables:

- conversations: patient conversation threads (id, patient_name, last_message, unread_count, created_at, updated_at, timestamp)
- messages: individual messages (id, conversation_id, sender, text, is_own, is_email, is_sms, subject, sender_email, recipient_email, phone_number, delivery_status, outlook_message_id, vonage_message_id, created_at, timestamp)
- leads: patient leads (id, name, email, phone, date, service, treatmenttype, created_at, updated_at)
- patients: patient records
- campaigns: marketing campaigns
- templates: message/email templates
- emails: email records
- integrations: third-party integrations
- users: staff users
- instaconversations, instamessages: Instagram channel data

Always use the query_database tool to answer questions. Format results using markdown tables when showing multiple rows.
Only run SELECT queries — never modify data. Be concise and professional.
When showing message text, truncate long messages to ~100 characters for readability.`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: SYSTEM_PROMPT,
    messages,
    maxSteps: 10,
    tools: {
      query_database: tool({
        description: 'Execute a read-only SQL SELECT query against the CRM PostgreSQL database.',
        parameters: z.object({
          sql: z.string().describe('A valid SQL SELECT query. Only SELECT or WITH statements are allowed.'),
        }),
        execute: async ({ sql }) => {
          const normalized = sql.trim().toUpperCase();
          if (!normalized.startsWith('SELECT') && !normalized.startsWith('WITH')) {
            return { error: 'Only SELECT queries are permitted.' };
          }
          try {
            const rows = await runQuery(sql);
            return { rows, count: rows.length };
          } catch (e) {
            return { error: (e as Error).message };
          }
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
