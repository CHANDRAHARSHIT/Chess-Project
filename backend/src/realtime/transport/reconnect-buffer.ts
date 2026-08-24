import type { OutboundMessage, ResumeToken } from "./transport.types.js";

const DEFAULT_MAX_BUFFER = 200;

/**
 * Per-logical-connection in-memory ring buffer for reconnect-replay.
 * Keyed by ResumeToken (stable across WebSocket reconnects).
 * In-memory only — no persistence across server restart.
 */
export class ReconnectBuffer {
  private readonly buffers = new Map<ResumeToken, OutboundMessage[]>();

  constructor(private readonly maxBuffer: number = DEFAULT_MAX_BUFFER) {}

  /**
   * Appends an outbound message to the logical connection's buffer.
   * Evicts oldest messages if capacity is exceeded.
   */
  push(resumeToken: ResumeToken, message: OutboundMessage): void {
    const list = this.buffers.get(resumeToken) ?? [];
    list.push(message);

    if (list.length > this.maxBuffer) {
      list.shift(); // Evict oldest
    }

    this.buffers.set(resumeToken, list);
  }

  /**
   * Replays all buffered messages with seq > afterSeq in monotonic order.
   */
  replay(resumeToken: ResumeToken, afterSeq: number): OutboundMessage[] {
    const list = this.buffers.get(resumeToken);
    if (!list) return [];

    return list.filter((msg) => msg.seq > afterSeq);
  }

  /**
   * Clears the buffer on clean client disconnect.
   */
  clear(resumeToken: ResumeToken): void {
    this.buffers.delete(resumeToken);
  }
}
