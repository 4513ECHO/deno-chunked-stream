import { ChunkedStream } from "./mod.ts";
import { assertEquals } from "jsr:@std/assert@^1.0.1/equals";

function testStream(): ReadableStream<number> {
  return new ReadableStream({
    start(controller) {
      for (let i = 0; i < 13; i++) {
        controller.enqueue(i);
      }
      controller.close();
    },
  });
}

function testArrayStream(): ReadableStream<number[]> {
  return new ReadableStream({
    start(controller) {
      for (let i = 0; i < 13; i++) {
        controller.enqueue([i]);
      }
      controller.close();
    },
  });
}

Deno.test("ChunkedStream", async () => {
  const result = [];
  for await (const chunk of testStream().pipeThrough(new ChunkedStream())) {
    result.push(chunk);
  }
  assertEquals(result, [
    [0],
    [1],
    [2],
    [3],
    [4],
    [5],
    [6],
    [7],
    [8],
    [9],
    [10],
    [11],
    [12],
  ]);
});

Deno.test("ChunkedStream - chunkSize", async () => {
  const result = [];
  for await (
    const chunk of testStream()
      .pipeThrough(new ChunkedStream({ chunkSize: 4 }))
  ) {
    result.push(chunk);
  }
  assertEquals(result, [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [8, 9, 10, 11],
    [12],
  ]);
});

Deno.test("ChunkedStream - chunkSize2nd", async () => {
  const result = [];
  for await (
    const chunk of testStream()
      .pipeThrough(new ChunkedStream({ chunkSize: 3, chunkSize2nd: 6 }))
  ) {
    result.push(chunk);
  }
  assertEquals(result, [
    [0, 1, 2],
    [3, 4, 5, 6, 7, 8],
    [9, 10, 11, 12],
  ]);
});

Deno.test("ChunkedStream - large chunkSize", async () => {
  const result = [];
  for await (
    const chunk of testStream()
      .pipeThrough(new ChunkedStream({ chunkSize: 9999 }))
  ) {
    result.push(chunk);
  }
  assertEquals(result, [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  ]);
});

Deno.test("ChunkedStream - array", async () => {
  const result = [];
  for await (
    const chunk of testArrayStream()
      .pipeThrough(new ChunkedStream({ chunkSize: 4 }))
  ) {
    result.push(chunk);
  }
  assertEquals(result, [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [8, 9, 10, 11],
    [12],
  ]);
});
