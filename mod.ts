/** Chunking TransformStream for Deno
 *
 * @module
 */

export interface ChunkedStreamOptions {
  /* Chunk size of stream (default: 1) */
  chunkSize: number;
  /* Chunk size of stream used except first enqueuing */
  chunkSize2nd?: number;
}

/** Chunking TransformStream
 *
 * @example
 * ```ts
 * import { ChunkedStream } from "https://deno.land/x/chunked_stream@$VERSION/mod.ts";
 * new ReadableStream()
 *   .pipeThrough(new ChunkedStream({ chunkSize: 100 }))
 * ```
 */
export class ChunkedStream<T> extends TransformStream<T | T[], T[]> {
  #chunk: T[] = [];
  #chunkSize: number;
  #chunkSize2nd?: number;
  #first = true;

  constructor(option?: ChunkedStreamOptions) {
    super({
      transform: (chunk, controller) => this.#handle(chunk, controller),
      flush: (controller) => this.#flush(controller),
    });
    this.#chunkSize = option?.chunkSize ?? 1;
    this.#chunkSize2nd = option?.chunkSize2nd;
  }

  #handle(
    chunk: T | T[],
    controller: TransformStreamDefaultController<T[]>,
  ): void {
    if (Array.isArray(chunk)) {
      this.#chunk = this.#chunk.concat(chunk);
    } else {
      this.#chunk.push(chunk);
    }
    if (this.#first) {
      this.#first = false;
    } else if (this.#chunkSize2nd && this.#chunkSize !== this.#chunkSize2nd) {
      this.#chunkSize = this.#chunkSize2nd;
    }
    if (this.#chunk.length >= this.#chunkSize) {
      controller.enqueue(this.#chunk);
      this.#chunk = [];
    }
  }

  #flush(controller: TransformStreamDefaultController<T[]>): void {
    if (this.#chunk.length > 0) {
      controller.enqueue(this.#chunk);
    }
  }
}