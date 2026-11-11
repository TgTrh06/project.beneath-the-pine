import { Injectable } from '@nestjs/common';
import { request } from 'node:https';
import { Readable } from 'node:stream';

/** Fixed HTTPS destination; no redirects or automatic retries. Native IPv4 TLS
 * avoids this Windows development host's undici connection-selection timeout. */
@Injectable()
export class OpenRouterHttpTransport {
  request(options: RequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
      const outgoing = request('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', family: 4, signal: options.signal ?? undefined,
        headers: Object.fromEntries(new Headers(options.headers)),
      }, incoming => {
        const headers = new Headers();
        for (const [name, value] of Object.entries(incoming.headers)) {
          if (Array.isArray(value)) value.forEach(item => headers.append(name, item));
          else if (value !== undefined) headers.set(name, value);
        }
        const status = incoming.statusCode ?? 502;
        if ([204, 205, 304].includes(status)) { incoming.resume(); resolve(new Response(null, { status, headers })); }
        else resolve(new Response(Readable.toWeb(incoming) as ReadableStream<Uint8Array>, { status, headers }));
      });
      outgoing.on('error', () => reject(new Error('OpenRouter transport unavailable')));
      outgoing.end(String(options.body ?? ''));
    });
  }
}
