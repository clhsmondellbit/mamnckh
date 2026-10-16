import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/chat/route';

function chatRequest(message: string, ip: string) {
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ sessionId: `session-${ip}`, message, history: [] }),
  });
}

describe('chat safety route', () => {
  it('returns the red safety path before trying a chat provider', async () => {
    const response = await POST(chatRequest('Em muốn tự làm đau mình.', 'red-test'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.supportLevel).toBe('red');
    expect(body.showEmergencySupport).toBe(true);
    expect(body.message).toMatch(/không ở một mình/i);
  });

  it('marks sustained bullying for adult support even when no provider is configured', async () => {
    const response = await POST(chatRequest('Các bạn bắt nạt mình nhiều lần.', 'yellow-test'));
    const body = await response.json();
    expect(body.supportLevel).toBe('yellow');
    expect(body.showHumanSupport).toBe(true);
  });

  it('keeps normal conversations usable through a transparent provider-failure fallback', async () => {
    const response = await POST(chatRequest('Mình lo vì điểm kiểm tra thấp.', 'green-test'));
    const body = await response.json();
    expect(body.supportLevel).toBe('green');
    expect(body.providerAvailable).toBe(false);
    expect(body.message).toMatch(/chưa thể phản hồi/i);
  });
});
