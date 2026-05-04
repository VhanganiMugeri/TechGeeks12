import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const openai = createOpenAI({
  baseURL: `${process.env.CODEWORDS_RUNTIME_URI}/run/openai/v1`,
  apiKey: process.env.CODEWORDS_API_KEY!,
});

const SYSTEM_PROMPT = `You are Edu AI Assistant, a helpful university chatbot for first-year students at VUT (Vaal University of Technology).

Available modules and lecturers:
1. Information Systems 1.1 & 1.2 - Lecturer: R Ndlovu, Office: P112, Email: ndlovu18@edu.vut.ac.za (ID: info_sys_11 / info_sys_12)
2. Development Software 1.1 & 1.2 - Lecturer: P Brown, Office: P113, Email: PBrown21@edu.vut.ac.za (ID: dev_soft_11 / dev_soft_12)
3. Accounting for IT 1.1 & 1.2 - Lecturer: R Thandanani, Office: P114, Email: Thandanani25@edu.vut.ac.za (ID: acc_it_11 / acc_it_12)
4. System Software 1.1 & 1.2 - Lecturer: Prof Dzuni, Office: P115, Email: DzuniProfessor@edu.vut.ac.za (ID: sys_soft_11 / sys_soft_12)

Respond ONLY with valid JSON:
{
  "intent": "select_module" | "book_appointment" | "send_enquiry" | "study_tips" | "info_answer" | "greeting" | "help" | "unknown",
  "module_id": "info_sys_11" | "dev_soft_11" | "acc_it_11" | "sys_soft_11" | "info_sys_12" | "dev_soft_12" | "acc_it_12" | "sys_soft_12" | null,
  "message": "Your short friendly response"
}

Rules:
- If student mentions a module or lecturer by name, set intent to "select_module" with correct module_id
- If student wants to book/schedule/appointment, set intent to "book_appointment" with module_id if mentioned
- If student wants to enquire/email, set intent to "send_enquiry" with module_id if mentioned
- If student asks for study tips/advice/help studying, set intent to "study_tips" with module_id if mentioned
- If student asks for SPECIFIC INFO like an office number, email address, or lecturer name, set intent to "info_answer" and put the EXACT data in your message. Examples:
  - "What is Prof Dzuni's office?" -> message: "Prof Dzuni's office number is P115."
  - "What is the email for Development Software?" -> message: "P Brown's email is PBrown21@edu.vut.ac.za."
  - "Who teaches Accounting for IT?" -> message: "R Thandanani teaches Accounting for IT."
  Always give the precise data from the list above.
- If student greets (hi, hello, hey), set intent to "greeting"
- If student asks what you can do, set intent to "help"
- For anything NOT related to VUT modules, lecturers, appointments, or academics, set intent to "unknown" with message: "Sorry, I can't help with that. For more information, please visit the VUT official website: https://www.vut.ac.za"
- Default to semester 1.1 unless student specifies 1.2
- ONLY output valid JSON`;

const TIPS_PROMPT = `You are a study advisor for first-year university students. Generate exactly 5 practical, specific study tips for the given module. Keep each tip concise (1-2 sentences). Be encouraging and practical. Format as a JSON array of strings:
["Tip 1...", "Tip 2...", "Tip 3...", "Tip 4...", "Tip 5..."]
ONLY output the JSON array, nothing else.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, action, moduleName } = body;

    if (action === 'study_tips' && moduleName) {
      const { text } = await generateText({
        model: openai('gpt-4.1-mini'),
        system: TIPS_PROMPT,
        prompt: `Generate 5 study tips for the university module: ${moduleName}`,
      });
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const tips = JSON.parse(cleaned);
      return Response.json({ tips });
    }

    const { text } = await generateText({
      model: openai('gpt-4.1-mini'),
      system: SYSTEM_PROMPT,
      prompt: message,
    });
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return Response.json(parsed);
  } catch {
    return Response.json({
      intent: 'unknown',
      module_id: null,
      message: "Sorry, I can't help with that. For more information, please visit the VUT official website: https://www.vut.ac.za",
    });
  }
}

