export interface PageCursor { time: Date; id: string; }
export interface CursorCodec {
  decode(cursor: string | undefined, scope: string): PageCursor | undefined;
  encode(time: Date, id: string, scope: string): string;
}
