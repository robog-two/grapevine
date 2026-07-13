import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { simpleParser } from 'mailparser';
import { requireSession } from '@/lib/session';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = await requireSession();
  const form = await req.formData();
  const file = form.get('file');
  const kind = String(form.get('kind') ?? 'file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (kind === 'eml') {
    const parsed = await simpleParser(buffer);
    const blob = await put(`${user.userId}/${nanoid()}-${file.name}`, buffer, {
      access: 'public',
      contentType: 'message/rfc822',
    });
    return NextResponse.json({
      blobUrl: blob.url,
      content: {
        type: 'eml',
        from: parsed.from?.text ?? 'Unknown sender',
        subject: parsed.subject ?? '(no subject)',
        date: (parsed.date ?? new Date()).toISOString(),
        bodyText: (parsed.text ?? '').slice(0, 5000),
      },
    });
  }

  const blob = await put(`${user.userId}/${nanoid()}-${file.name}`, buffer, {
    access: 'public',
    contentType: file.type || 'application/octet-stream',
  });

  if (kind === 'photo') {
    return NextResponse.json({ blobUrl: blob.url, content: { type: 'photo', caption: String(form.get('caption') ?? '') } });
  }

  return NextResponse.json({
    blobUrl: blob.url,
    content: { type: 'file', filename: file.name, mime: file.type || 'application/octet-stream', size: file.size },
  });
}
