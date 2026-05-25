import { expect, test } from "bun:test";
import { parseImagePath, copyImageToDest } from "../src/index";
import { unlink } from "node:fs/promises";

test("should fail when no prompt is provided", async () => {
  const process = Bun.spawn(["bun", "run", "src/index.ts"], {
    stderr: "pipe",
  });
  const stderr = await new Response(process.stderr).text();
  const exitCode = await process.exited;

  expect(exitCode).not.toBe(0);
  expect(stderr).toContain("Error: Please provide a prompt");
});

test("parseImagePath should extract image URL from stdout", () => {
  const stdoutMock1 = "Here is your image: ![apple](file:///C:/Users/Fam/AppData/Local/agy/brain/123/apple.png)";
  expect(parseImagePath(stdoutMock1)).toBe("C:/Users/Fam/AppData/Local/agy/brain/123/apple.png");

  const stdoutMock2 = "I created it at C:\\Users\\Fam\\AppData\\Local\\agy\\brain\\123\\apple.png. Hope you like it.";
  expect(parseImagePath(stdoutMock2)).toBe("C:/Users/Fam/AppData/Local/agy/brain/123/apple.png");

  const stdoutMock3 = "No image path here.";
  expect(parseImagePath(stdoutMock3)).toBeNull();
});

test("copyImageToDest should successfully copy a file", async () => {
  const dummySrc = "dummy_src.png";
  const dummyDest = "dummy_dest.png";
  
  // Write a dummy file
  await Bun.write(dummySrc, "mock png content");

  // Call copyImageToDest
  const result = await copyImageToDest(dummySrc, dummyDest);
  expect(result).toBe(true);

  // Check if destination exists and has matching content
  const destFile = Bun.file(dummyDest);
  expect(await destFile.exists()).toBe(true);
  expect(await destFile.text()).toBe("mock png content");

  // Clean up
  await unlink(dummySrc);
  await unlink(dummyDest);
});

test("copyImageToDest should return false if source file does not exist", async () => {
  const result = await copyImageToDest("nonexistent_file_12345.png", "dest.png");
  expect(result).toBe(false);
});

