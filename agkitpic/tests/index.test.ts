import { expect, test } from "bun:test";

test("should fail when no prompt is provided", async () => {
  const process = Bun.spawn(["bun", "run", "src/index.ts"], {
    stderr: "pipe",
  });
  const stderr = await new Response(process.stderr).text();
  const exitCode = await process.exited;

  expect(exitCode).not.toBe(0);
  expect(stderr).toContain("Error: Please provide a prompt");
});
