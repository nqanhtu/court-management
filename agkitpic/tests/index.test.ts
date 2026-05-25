import { expect, test } from "bun:test";
import { parseImagePath } from "../src/index";

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
