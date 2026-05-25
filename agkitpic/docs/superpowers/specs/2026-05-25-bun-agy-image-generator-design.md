# Spec: Bun Application for CLI Image Generation with Antigravity CLI (agy)

Date: 2026-05-25
Status: Approved

## Goal Description

Write a Bun runtime command-line application that takes a prompt as a command line argument, invokes the Antigravity CLI (`agy`) to generate an image based on that prompt, parses the output to find the path of the generated image, and copies the image to the current working directory.

## Design

### 1. Requirements

- Runtime: Bun (v1.x or higher)
- Input: Command-line argument (e.g., `bun run src/index.ts "a prompt"`)
- Output: 
  - Real-time logging of the `agy` CLI stdout/stderr.
  - A copied image file in the current working directory (e.g., `output.png`).
  - Output message stating where the image was saved.

### 2. Interaction Flow

1. Parse the command-line argument using `Bun.argv`.
2. Validate that a prompt is provided.
3. Spawn the child process:
   ```bash
   agy --print "Tạo một ảnh từ prompt: <PROMPT>" --dangerously-skip-permissions
   ```
4. Read and decode the `stdout` stream of the child process in real-time.
5. Print stdout chunks to the console.
6. Search the accumulated stdout for file path references using regular expressions.
7. Wait for the subprocess to exit.
8. If an image path is detected:
   - Convert the URL/path to a local file path.
   - Verify the file exists.
   - Copy the file to the current working directory.
   - Print confirmation.

### 3. Image Path Detection Regex

The CLI generates images and links them using Markdown format:
`![caption](file:///C:/path/to/image.png)`

The regular expression will target:
`/(?:file:\/\/\/|)([a-zA-Z]:[^\s\)]+\.(?:png|jpg|jpeg|webp))/gi`
or specifically capturing `file:///` URLs of images:
`/file:\/\/\/([a-zA-Z]:[^\s\)]+\.(?:png|jpg|jpeg|webp))/i`

### 4. File Copying Mechanism

Use Bun's high-performance File API:
```typescript
const srcFile = Bun.file(absoluteSrcPath);
if (await srcFile.exists()) {
  await Bun.write("output.png", srcFile);
  console.log(`Success: Image saved to output.png`);
} else {
  console.error(`Error: Source file does not exist at ${absoluteSrcPath}`);
}
```

## Verification Plan

### Manual Verification
1. Run `bun run src/index.ts "quả táo màu xanh"`
2. Verify that the agent outputs progress in the console.
3. Verify that `output.png` is created in the root folder.
4. Open `output.png` and verify it contains a green apple.
