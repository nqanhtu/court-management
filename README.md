# Phần mềm chỉnh lý hồ sơ (UI Prototype)

This is a Next.js + Tailwind CSS prototype of the "Phần mềm chỉnh lý hồ sơ" application.

## Getting Started

1.  Navigate to the app directory:
    ```bash
    cd app
    ```

2.  Install dependencies (if not already installed):
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Pages Implemented

-   **Dashboard / Hồ sơ** (`/`): Corresponds to `trang3.jpg` (File Management).
-   **Người dùng** (`/users`): Corresponds to `trang1.jpg` (User Management).
-   **Mượn trả** (`/borrow`): Corresponds to `trang2.jpg` (Borrow/Return Management).
-   **Báo cáo** (`/reports`): Corresponds to `trang4.jpg` (Reports/History).

## Features

-   **Responsive Layout**: Adapts to screen size, though optimized for desktop like the original app.
-   **Persistent Footer**: The "Kho lưu trữ" section is always visible at the bottom.
-   **Navigation**: Functional sidebar to switch between views.