export function parseImagePath(text: string): string | null {
  // Match file:///C:/.../file.png or C:/.../file.png or C:\...\file.png
  const fileUrlRegex = /file:\/\/\/([a-zA-Z]:[^\s\)]+\.(?:png|jpg|jpeg|webp))/gi;
  const matchUrl = fileUrlRegex.exec(text);
  if (matchUrl) {
    return matchUrl[1].replace(/\\/g, "/");
  }

  const winPathRegex = /([a-zA-Z]:[\/\\][^\s\)]+\.(?:png|jpg|jpeg|webp))/gi;
  const matchPath = winPathRegex.exec(text);
  if (matchPath) {
    return matchPath[1].replace(/\\/g, "/");
  }

  return null;
}

export async function copyImageToDest(imagePath: string, destPath: string): Promise<boolean> {
  const srcFile = Bun.file(imagePath);
  if (await srcFile.exists()) {
    await Bun.write(destPath, srcFile);
    return true;
  }
  return false;
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
    const success = await copyImageToDest(imagePath, "output.png");
    if (success) {
      console.log(`\n\x1b[32mSuccess: Image successfully saved to output.png\x1b[0m`);
    } else {
      console.error(`\nError: Image path parsed but file not found at: ${imagePath}`);
      process.exit(1);
    }
  } else {
    console.error("\nError: Could not find any generated image path in the CLI output.");
    process.exit(1);
  }
}
