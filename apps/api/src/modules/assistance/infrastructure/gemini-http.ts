import { Injectable } from '@nestjs/common';
import { request } from 'node:https';
import { Readable } from 'node:stream';

/** Native TLS transport: this Windows host times out in undici's connection selection.
 * No retries/redirects; the caller owns the deadline and bounds the streamed body.
 */
@Injectable()
export class GeminiHttpTransport {
  request(url: string, options: RequestInit): Promise<Response> {
    const target = new URL(url);
    if (target.origin !== 'https://generativelanguage.googleapis.com' || target.username || target.password) throw new Error('Invalid Gemini origin');
    return new Promise((resolve, reject) => {
      const outgoing = request(target, { method: 'POST', family: 4, signal: options.signal ?? undefined,
        headers: Object.fromEntries(new Headers(options.headers)) }, incoming => {
        const headers = new Headers();
        for (const [name, value] of Object.entries(incoming.headers)) {
          if (Array.isArray(value)) value.forEach(item => headers.append(name, item));
          else if (value !== undefined) headers.set(name, value);
        }
        const status = incoming.statusCode ?? 502;
        if ([204, 205, 304].includes(status)) { incoming.resume(); resolve(new Response(null, { status, headers })); }
        else resolve(new Response(Readable.toWeb(incoming) as ReadableStream<Uint8Array>, { status, headers }));
      });
      outgoing.on('error', () => reject(new Error('Gemini transport unavailable')));
      outgoing.end(String(options.body ?? ''));
    });
  }
}
