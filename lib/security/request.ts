export class JsonRequestError extends Error {
  readonly status: 400 | 403 | 413 | 415;

  constructor(message: string, status: 400 | 403 | 413 | 415) {
    super(message);
    this.name = 'JsonRequestError';
    this.status = status;
  }
}

/** Read a JSON body with an actual streamed byte limit rather than trusting Content-Length. */
export async function readJsonRequest(request: Request, maxBytes: number): Promise<unknown> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    throw new JsonRequestError('Expected application/json', 415);
  }

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new JsonRequestError('Request body is too large', 413);
  }

  if (!request.body) throw new JsonRequestError('Request body is missing', 400);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new JsonRequestError('Request body is too large', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new JsonRequestError('Malformed JSON body', 400);
  }
}

/**
 * Mutating browser endpoints should only accept same-origin requests. Configure
 * APP_URL in production when TLS terminates at a reverse proxy.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  try {
    const expectedOrigin = process.env.APP_URL
      ? new URL(process.env.APP_URL).origin
      : new URL(request.url).origin;
    return new URL(origin).origin === expectedOrigin;
  } catch {
    return false;
  }
}

export function noStoreHeaders(): HeadersInit {
  return {
    'Cache-Control': 'no-store, max-age=0',
    Pragma: 'no-cache',
  };
}
