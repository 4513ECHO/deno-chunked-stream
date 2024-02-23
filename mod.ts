/** Chunking TransformStream for Deno
 *
 * @module
 */

export interface ChunkedStreamOptions {
  /** Chunk size of stream (default: 1) */
  chunkSize: number;
  /** Chunk size of stream used except first enqueuing */
  chunkSize2nd?: number;
}

/** Chunking TransformStream
 *
 * @example
 * ```ts
 * import { ChunkedStream } from "https://deno.land/x/chunked_stream@$MODULE_VERSION/mod.ts";
 *
 * const stream = new ReadableStream({
 *   start(controller) {
 *     let i = 0;
 *     while (true) {
 *       controller.enqueue(i);
 *       i++;
 *     }
 *   },
 * })
 *   .pipeThrough(new ChunkedStream({ chunkSize: 4 }));
 *
 * for await (const chunk of stream) {
 *   console.log(chunk); // [0, 1, 2, 3], [4, 5, 6, 7], ...
 * }
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
    if (this.#chunk.length >= this.#chunkSize) {
      controller.enqueue(this.#chunk);
      this.#chunk = [];
      if (this.#first) {
        this.#first = false;
        if (this.#chunkSize2nd && this.#chunkSize !== this.#chunkSize2nd) {
          this.#chunkSize = this.#chunkSize2nd;
        }
      }
    }
  }

  #flush(controller: TransformStreamDefaultController<T[]>): void {
    if (this.#chunk.length > 0) {
      controller.enqueue(this.#chunk);
    }
  }
}
