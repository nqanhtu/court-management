if (Bun.argv.length < 3) {
  console.error("Error: Please provide a prompt in quotes.");
  console.error("Usage: bun run src/index.ts \"your image prompt\"");
  process.exit(1);
}
