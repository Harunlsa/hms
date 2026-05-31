# Project Overview: HMS (Hospital Management System)

This is a modern Hospital Management System built as a desktop application using **Tauri**, **React**, and **TypeScript**. It utilizes **Ant Design** for a professional medical UI and **Zustand** for lightweight state management.

## Architecture

The project follows a modular, feature-based architecture focused on clinical workflows.

- **Frontend:** React 19 with TypeScript, styled with Tailwind CSS 4 and Ant Design 6.
- **Backend:** Tauri (Rust) for native desktop capabilities and system integration.
- **State Management:** Zustand stores located within feature modules (`src/modules/*/store`) and global UI state (`src/store`).
- **Data Access:** Repository pattern. Currently uses mock repositories (`*.mock.ts`) that will be transitioned to Tauri IPC calls (`src/modules/*/services/*.api.ts`) as the backend matures.
- **Routing:** React Router 7 with a structured route definition in `src/app/routes.tsx`.

## Project Structure

- `src/app`: Application core, including router and global routes.
- `src/modules`: Feature-specific modules (e.g., `patients`). Each module contains its own components, store, types, and services.
- `src/shared`: Reusable components, hooks, and utilities used across the application.
- `src/layouts`: Main application shell and navigation layouts.
- `src/styles`: Theme configuration and global CSS.
- `src-tauri`: Rust backend logic and Tauri configuration.

## Development Workflows

### Building and Running

- `npm run tauri dev`: Start the desktop application in development mode with HMR.
- `npm run dev`: Start only the Vite web development server (at http://localhost:1420).
- `npm run build`: Compile TypeScript and build the web assets.
- `npm run tauri build`: Create a production bundle of the desktop application.

### Key Conventions

- **Component Design:** Prefer functional components with hooks. Use Ant Design primitives for consistent UI.
- **Type Safety:** Maintain strict TypeScript definitions in `types/` folders within each module.
- **State:** Use Zustand for module-level state. Avoid deep prop drilling by leveraging stores.
- **Data Handling:** Always go through the `repository` interface to maintain decoupling between UI and data source.

## Future Roadmap
- Integration of the Rust backend for persistence (SQLite/PostgreSQL).
- Implementation of Staff, Pharmacy, and Laboratory modules.
- Enhanced reporting and visit summary printing capabilities.
