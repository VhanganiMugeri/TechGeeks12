import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    if (!audioFile) return Response.json({ error: 'No audio file provided' }, { status: 400 });

    const whisperForm = new FormData();
    whisperForm.append('file', audioFile, 'audio.webm');
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('language', 'en');

    const response = await fetch(
      `${process.env.CODEWORDS_RUNTIME_URI}/run/openai/v1/audio/transcriptions`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.CODEWORDS_API_KEY}` },
        body: whisperForm,
      }
    );

    if (!response.ok) {
      return Response.json({ error: 'Transcription failed' }, { status: 500 });
    }

    const result = await response.json();
    return Response.json({ text: result.text });
  } catch {
    return Response.json({ error: 'Transcription failed' }, { status: 500 });
  }
}

