import fs from 'fs';
import path from 'path';

export interface ChangelogFile {
  filename: string;
  title: string;
  date: string;
}

export function getChangelogFiles(): ChangelogFile[] {
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    return [];
  }
  
  try {
    const files = fs.readdirSync(docsDir);
    const changelogFiles: ChangelogFile[] = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(docsDir, file);
        try {
          const stats = fs.statSync(filePath);
          if (!stats.isFile()) {
            continue;
          }

          // Performance optimization: read only the first 2048 bytes to extract the H1 title
          let headerChunk = '';
          const fd = fs.openSync(filePath, 'r');
          try {
            const buffer = Buffer.alloc(2048);
            const bytesRead = fs.readSync(fd, buffer, 0, 2048, 0);
            headerChunk = buffer.toString('utf8', 0, bytesRead);
          } finally {
            fs.closeSync(fd);
          }

          // Extract title from the first # line
          const lines = headerChunk.split(/\r?\n/);
          let title = file;
          for (const line of lines) {
            if (line.trim().startsWith('# ')) {
              title = line.trim().substring(2);
              break;
            }
          }

          // Extract date from filename: YYYY-MM-DD
          const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
          const date = dateMatch ? dateMatch[1] : '';

          changelogFiles.push({
            filename: file,
            title,
            date,
          });
        } catch (fileErr) {
          console.error(`Error processing changelog file ${file}:`, fileErr);
        }
      }
    }

    // Sort by date descending (newest first), stable sort fallback
    return changelogFiles.sort((a, b) => {
      if (!a.date && !b.date) {
        return a.filename.localeCompare(b.filename);
      }
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
  } catch (dirErr) {
    console.error('Error reading changelog directory:', dirErr);
    return [];
  }
}

export function getChangelogContent(filename: string): string | null {
  try {
    const docsDir = path.join(process.cwd(), 'docs');
    const safeFilename = path.basename(filename);
    const filePath = path.join(docsDir, safeFilename);
    
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return null;
    }
    
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`Error reading changelog content for ${filename}:`, err);
    return null;
  }
}

