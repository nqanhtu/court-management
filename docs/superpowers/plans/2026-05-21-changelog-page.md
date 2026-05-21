# Chuyên trang Changelog Hệ thống Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo chuyên trang độc lập `/changelog` cho phép đọc tài liệu nhật ký thay đổi trong thư mục `docs/` một cách tự động, không yêu cầu đăng nhập, thiết kế 3 cột hiện đại hỗ trợ Light/Dark mode.

**Architecture:** Sử dụng Next.js Server Components để quét thư mục `docs/` ở runtime và render trang. Chuyển đổi file chọn thông qua URL query parameter `?file=filename.md`. Sử dụng thư viện `marked` để biên dịch Markdown thành HTML an toàn phía server.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Lucide React, marked.

---

### Task 1: Cài đặt thư viện `marked`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Cài đặt thư viện marked**

Run: `pnpm add marked`
Expected: Cài đặt thành công `marked`, cập nhật `package.json` và `pnpm-lock.yaml`.

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install marked library for markdown parsing"
```

---

### Task 2: Tạo module nghiệp vụ đọc file Changelog

**Files:**
- Create: `lib/changelog.ts`

- [ ] **Step 1: Tạo file helper quét thư mục docs và đọc nội dung**

Tạo file mới tại [lib/changelog.ts](file:///f:/projects/court-management/lib/changelog.ts) chứa logic quét thư mục, trích xuất tiêu đề từ dòng H1 đầu tiên và sắp xếp file theo ngày tháng.

```typescript
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
  const files = fs.readdirSync(docsDir);
  const changelogFiles: ChangelogFile[] = [];

  for (const file of files) {
    if (file.endsWith('.md')) {
      const filePath = path.join(docsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract title from the first # line
      const lines = content.split('\n');
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
    }
  }

  // Sort by date descending (newest first)
  return changelogFiles.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });
}

export function getChangelogContent(filename: string): string | null {
  const docsDir = path.join(process.cwd(), 'docs');
  const safeFilename = path.basename(filename);
  const filePath = path.join(docsDir, safeFilename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf-8');
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/changelog.ts
git commit -m "feat(changelog): add filesystem utilities to scan and read changelog files"
```

---

### Task 3: Cấu hình CSS định dạng Markdown

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Thêm lớp CSS chuyên dụng cho nội dung biên dịch từ Markdown**

Bổ sung các định dạng cho `.markdown-body` vào cuối file [app/globals.css](file:///f:/projects/court-management/app/globals.css) để hiển thị tiêu đề, văn bản, danh sách, mã code, trích dẫn, bảng dữ liệu đẹp mắt và tương thích cả sáng lẫn tối.

```css

/* Markdown Changelog Styling */
.markdown-body {
  line-height: 1.7;
  color: var(--foreground);
  font-size: 1rem;
}

.markdown-body h1 {
  font-size: 2rem;
  font-weight: 800;
  margin-top: 0;
  margin-bottom: 1.5rem;
  line-height: 1.25;
  letter-spacing: -0.025em;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
}

.markdown-body h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
  line-height: 1.375;
  letter-spacing: -0.02em;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.375rem;
}

.markdown-body h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.markdown-body p {
  margin-top: 0;
  margin-bottom: 1.25rem;
  color: var(--foreground);
  opacity: 0.9;
}

.markdown-body ul {
  list-style-type: disc;
  margin-top: 0;
  margin-bottom: 1.25rem;
  padding-left: 1.5rem;
}

.markdown-body ol {
  list-style-type: decimal;
  margin-top: 0;
  margin-bottom: 1.25rem;
  padding-left: 1.5rem;
}

.markdown-body li {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

.markdown-body code {
  font-family: var(--font-mono, monospace);
  font-size: 0.85em;
  background-color: var(--muted);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--primary);
}

.markdown-body pre {
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
  padding: 1rem;
  overflow-x: auto;
  background-color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 6px;
}

.markdown-body pre code {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  color: inherit;
  font-size: 0.875rem;
}

.markdown-body blockquote {
  margin: 1.25rem 0;
  padding-left: 1rem;
  border-left: 4px solid var(--primary);
  color: var(--muted-foreground);
  font-style: italic;
}

.markdown-body table {
  width: 100%;
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
  border-collapse: collapse;
}

.markdown-body th, .markdown-body td {
  padding: 0.625rem;
  border: 1px solid var(--border);
  text-align: left;
}

.markdown-body th {
  background-color: var(--muted);
  font-weight: 600;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "style(changelog): add markdown typography custom styles"
```

---

### Task 4: Tạo trang Changelog giao diện 3 cột

**Files:**
- Create: `app/changelog/page.tsx`
- Create: `components/changelog/theme-toggle.tsx`

- [ ] **Step 1: Tạo component ThemeToggle**

Tạo file [components/changelog/theme-toggle.tsx](file:///f:/projects/court-management/components/changelog/theme-toggle.tsx) làm nhiệm vụ thay đổi giao diện sáng/tối bằng cách thay đổi class `.dark` trực tiếp trên thẻ root HTML.

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkClass = document.documentElement.classList.contains('dark');
    setIsDark(isDarkClass);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      title="Đổi giao diện"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
```

- [ ] **Step 2: Tạo trang đọc changelog**

Tạo file [app/changelog/page.tsx](file:///f:/projects/court-management/app/changelog/page.tsx) là một Server Component. Trang này sẽ:
1. Đọc danh sách file.
2. Await `searchParams` để xác định file đang active (mặc định lấy file mới nhất).
3. Đọc nội dung file active.
4. Trích xuất các tiêu đề H2 để tạo mục lục TOC động.
5. Biên dịch nội dung bằng `marked` với cấu hình slug cho các tiêu đề.
6. Render giao diện 3 cột.

```tsx
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';
import { Marked } from 'marked';
import { getChangelogFiles, getChangelogContent } from '@/lib/changelog';
import { ThemeToggle } from '@/components/changelog/theme-toggle';

// Thiết lập Marked custom renderer để tự sinh id slug cho các tiêu đề h2, h3 để làm TOC
const marked = new Marked();
const renderer = {
  heading(args: any) {
    let text = '';
    let level = 2;
    if (typeof args === 'object' && args !== null) {
      text = args.text || '';
      level = args.depth || 2;
    } else {
      text = arguments[0] || '';
      level = arguments[1] || 2;
    }
    const slug = text.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u00c0-\u1ef9-]/g, '');
    return `<h${level} id="${slug}">${text}</h${level}>`;
  }
};
marked.use({ renderer });

interface PageProps {
  searchParams: Promise<{ file?: string }>;
}

export default async function ChangelogPage({ searchParams }: PageProps) {
  const { file: selectedFile } = await searchParams;
  const files = getChangelogFiles();

  if (files.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
        <h1 className="text-2xl font-bold mb-2">Chưa có nhật ký thay đổi</h1>
        <p className="text-muted-foreground mb-4">Hãy thêm các file .md vào thư mục docs của dự án.</p>
        <Link href="/" className="text-primary hover:underline flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại trang chính
        </Link>
      </div>
    );
  }

  const activeFile = selectedFile || files[0].filename;
  const rawContent = getChangelogContent(activeFile) || '';
  const htmlContent = marked.parse(rawContent) as string;

  // Trích xuất tiêu đề h2 để tạo danh sách Mục lục TOC bên phải
  const toc: { id: string; text: string }[] = [];
  const headingRegex = /^##\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(rawContent)) !== null) {
    const text = match[1].trim();
    const id = text.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u00c0-\u1ef9-]/g, '');
    toc.push({ id, text });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Quay lại hệ thống</span>
            </Link>
            <span className="h-4 w-px bg-border hidden sm:block"></span>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h1 className="font-bold text-lg tracking-tight">Changelog Hệ thống</h1>
            </div>
          </div>
          <div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full min-h-0">
        
        {/* Cột Trái: Danh sách files */}
        <aside className="w-72 border-r p-6 overflow-y-auto hidden md:block shrink-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
            <Clock className="w-4 h-4" />
            <span>Lịch sử nâng cấp</span>
          </div>
          <nav className="space-y-1">
            {files.map((f) => {
              const isActive = f.filename === activeFile;
              return (
                <Link
                  key={f.filename}
                  href={`/changelog?file=${f.filename}`}
                  className={`block p-3 rounded-lg border text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/5 border-primary/30 text-primary font-medium shadow-sm'
                      : 'border-transparent hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="font-semibold line-clamp-2 leading-snug">{f.title}</div>
                  {f.date && (
                    <div className="text-xs mt-1.5 opacity-70 flex items-center">
                      {f.date}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Cột Giữa: Nội dung chính */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:px-12">
          {/* Dropdown thay thế cho Sidebar trên Mobile */}
          <div className="md:hidden mb-6">
            <label htmlFor="changelog-select" className="block text-xs font-semibold text-muted-foreground mb-2">
              Chọn phiên bản nâng cấp:
            </label>
            <select
              id="changelog-select"
              defaultValue={activeFile}
              onChange={(e) => {
                window.location.search = `?file=${e.target.value}`;
              }}
              className="w-full p-2.5 rounded-lg border bg-card text-sm font-medium"
            >
              {files.map((f) => (
                <option key={f.filename} value={f.filename}>
                  {f.date ? `[${f.date}] ` : ''}{f.title}
                </option>
              ))}
            </select>
          </div>

          <article className="markdown-body max-w-3xl mx-auto">
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </article>
        </main>

        {/* Cột Phải: Mục lục TOC */}
        {toc.length > 0 && (
          <aside className="w-64 p-8 overflow-y-auto hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Nội dung chính
            </h3>
            <nav className="space-y-2.5 text-sm">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-muted-foreground hover:text-foreground hover:underline transition-colors leading-relaxed line-clamp-2"
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </aside>
        )}

      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/changelog/theme-toggle.tsx app/changelog/page.tsx
git commit -m "feat(changelog): implement public changelog page with 3-column responsive layout and theme toggle"
```

---

### Task 5: Kiểm tra và xác minh

**Files:**
- None

- [ ] **Step 1: Chạy build ứng dụng để đảm bảo không lỗi compiler**

Run: `pnpm run build`
Expected: Next.js build hoàn thành thành công, compile `/changelog` tĩnh và động mà không có lỗi TypeScript hay lints.

- [ ] **Step 2: Chạy dev server thử nghiệm và dọn dẹp các tiến trình nền**

Run: `pnpm run dev`
Expected: Server chạy ổn định.
(Hướng dẫn kiểm tra thủ công giao diện trực quan).
