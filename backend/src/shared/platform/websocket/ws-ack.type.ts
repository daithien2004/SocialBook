export type WsAckResponse<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true } & T)
  | { ok: false; code: string; message: string; data?: unknown };
