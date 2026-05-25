# Bun CLI Image Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Bun-based command line utility that takes a text prompt as an argument, runs the `agy` CLI in print mode with the prompt, displays its stdout/stderr in real-time, finds the path to the generated image file in stdout, and copies it to the current directory as `output.png`.

**Architecture:** A single TypeScript entrypoint script using Bun's native APIs (`Bun.argv` for CLI arguments, `Bun.spawn` for subprocess, `Bun.write` and `Bun.file` for file I/O). Testing is performed using `bun:test`.

**Tech Stack:** Bun, TypeScript, bun:test

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.ts`
- Create: `tests/index.test.ts`

- [ ] **Step 1: Create configuration files**
  Create `package.json` and `tsconfig.json`.
  
  `package.json`:
  ```json
  {
    "name": "bun-agy-image-generator",
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "start": "bun run src/index.ts",
      "test": "bun test"
    },
    "devDependencies": {
      "@types/bun": "latest"
    }
  }
  ```

  `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "lib": ["ESNext"],
      "module": "esnext",
      "target": "esnext",
      "moduleResolution": "bundler",
      "moduleDetection": "force",
      "allowImportingTsExtensions": true,
      "noEmit": true,
      "strict": true,
      "downlevelIteration": true,
      "skipLibCheck": true,
      "allowSyntheticDefaultImports": true,
      "forceConsistentCasingInFileNames": true
    }
  }
  ```

- [ ] **Step 2: Create a failing test for CLI arguments validation**
  Create `tests/index.test.ts` with a test that checks if the script returns an error when no prompt is provided.
  Since we want to test CLI execution, we can spawn the script itself.

  `tests/index.test.ts`:
  ```typescript
  import { expect, test } from "bun:test";

  test("should fail when no prompt is provided", async () => {
    const process = Bun.spawn(["bun", "run", "src/index.ts"]);
    const stdout = await new Response(process.stdout).text();
    const stderr = await new Response(process.stderr).text();
    const exitCode = await process.exited;

    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("Error: Please provide a prompt");
  });
  ```

- [ ] **Step 3: Run the test to make sure it fails**
  Run: `bun test`
  Expected output: Fail because `src/index.ts` does not exist or has no logic.

- [ ] **Step 4: Implement minimal code to pass the test**
  Create `src/index.ts`:
  ```typescript
  if (Bun.argv.length < 3) {
    console.error("Error: Please provide a prompt in quotes.");
    console.error("Usage: bun run src/index.ts \"your image prompt\"");
    process.exit(1);
  }
  ```

- [ ] **Step 5: Run tests to verify they pass**
  Run: `bun test`
  Expected output: Pass.

- [ ] **Step 6: Commit**
  Run:
  ```bash
  git add package.json tsconfig.json src/index.ts tests/index.test.ts
  git commit -m "chore: scaffold project and add arg validation"
  ```

---

### Task 2: Subprocess Spawning & Real-Time Log Streaming

**Files:**
- Modify: `src/index.ts`
- Modify: `tests/index.test.ts`

- [ ] **Step 1: Write a test for stdout log streaming and regex extraction**
  Modify `tests/index.test.ts` to add a test. We will export helper functions from `src/index.ts` to test them in isolation without spawning the actual `agy` process (which is slow and depends on LLM APIs).
  
  `tests/index.test.ts` (Appended):
  ```typescript
  import { parseImagePath } from "../src/index";

  test("parseImagePath should extract image URL from stdout", () => {
    const stdoutMock1 = "Here is your image: ![apple](file:///C:/Users/Fam/AppData/Local/agy/brain/123/apple.png)";
    expect(parseImagePath(stdoutMock1)).toBe("C:/Users/Fam/AppData/Local/agy/brain/123/apple.png");

    const stdoutMock2 = "I created it at C:\\Users\\Fam\\AppData\\Local\\agy\\brain\\123\\apple.png. Hope you like it.";
    expect(parseImagePath(stdoutMock2)).toBe("C:/Users/Fam/AppData/Local/agy/brain/123/apple.png");

    const stdoutMock3 = "No image path here.";
    expect(parseImagePath(stdoutMock3)).toBeNull();
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `bun test`
  Expected: Compile error because `parseImagePath` is not defined in `src/index.ts`.

- [ ] **Step 3: Implement streaming logic and path extraction**
  Update `src/index.ts`:
  ```typescript
  export function parseImagePath(text: string): string | null {
    // Match file:///C:/.../file.png or C:\...\file.png
    // Capture group matches the clean Windows path
    const fileUrlRegex = /file:\/\/\/([a-zA-Z]:[^\s\)]+\.(?:png|jpg|jpeg|webp))/gi;
    const matchUrl = fileUrlRegex.exec(text);
    if (matchUrl) {
      return matchUrl[1].replace(/\\/g, "/");
    }

    const winPathRegex = /([a-zA-Z]:\\[^\s\)]+\.(?:png|jpg|jpeg|webp))/gi;
    const matchPath = winPathRegex.exec(text);
    if (matchPath) {
      return matchPath[1].replace(/\\/g, "/");
    }

    return null;
  }

  if (import.meta.main) {
    if (Bun.argv.length < 3) {
      console.error("Error: Please provide a prompt in quotes.");
      console.error("Usage: bun run src/index.ts \"your image prompt\"");
      process.exit(1);
    }

    const prompt = Bun.argv[2];
    console.log(`Starting image generation with prompt: "${prompt}"...`);

    const child = Bun.spawn(["agy", "--print", `tạo ảnh: ${prompt}`, "--dangerously-skip-permissions"], {
      stdout: "pipe",
      stderr: "inherit",
    });

    const reader = child.stdout.getReader();
    const decoder = new TextDecoder();
    let accumulatedStdout = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      process.stdout.write(chunk);
      accumulatedStdout += chunk;
    }

    const imagePath = parseImagePath(accumulatedStdout);
    if (imagePath) {
      const srcFile = Bun.file(imagePath);
      if (await srcFile.exists()) {
        await Bun.write("output.png", srcFile);
        console.log(`\n\x1b[32mSuccess: Image successfully saved to output.png\x1b[0m`);
      } else {
        console.error(`\nError: Image path parsed but file not found at: ${imagePath}`);
      }
    } else {
      console.error("\nError: Could not find any generated image path in the CLI output.");
      process.exit(1);
    }
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**
  Run: `bun test`
  Expected: Pass.

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add src/index.ts tests/index.test.ts
  git commit -m "feat: implement streaming, path parsing, and image copying"
  ```

---

### Task 3: Integration and Manual Verification

- [ ] **Step 1: Test with the actual agy CLI**
  Run the script to generate a simple image:
  ```bash
  bun run src/index.ts "quả táo màu xanh"
  ```
- [ ] **Step 2: Check result**
  Verify:
  1. The agent process executes and logs output.
  2. A file named `output.png` is generated in the workspace.
  3. The console displays the success message.
