# Shorty - Desktop Productivity App

## Project Overview
This is a cross-platform desktop productivity application built with Tauri 2.0 and TypeScript. The app captures screenshots with voice context and uses AI (OpenAI GPT-4 + Whisper) to provide intelligent analysis and insights.

**Current Status**: Fresh Tauri project scaffold, ready for Step 1 implementation

## Core Functionality
1. **Global Shortcut** (e.g., Ctrl+Shift+C) → captures entire screen
2. **Voice Recording** → adds audio context/explanation
3. **AI Processing** → analyzes screenshot + transcript
4. **Smart Insights** → provides actionable responses through specialized agents

## Architecture

### Frontend
- **Language**: TypeScript
- **Build Tool**: Vite
- **Entry Point**: `src/main.ts`
- **Styling**: `src/styles.css`
- **Assets**: `src/assets/`

### Backend
- **Language**: Rust
- **Framework**: Tauri 2.0
- **Main Entry**: `src-tauri/src/main.rs`
- **Library**: `src-tauri/src/lib.rs`
- **Configuration**: `src-tauri/tauri.conf.json`

## Development Commands

```bash
# Install dependencies
bun install

# Run development server
bun run tauri dev

# Build for production
bun run tauri build

# Run frontend only (Vite)
bun run dev

# Type checking
bun run build
```

## Implementation Roadmap

### Step 1: Screenshot Foundation ✅
- [ ] Add global keyboard shortcut handling
- [ ] Implement full-screen capture using `xcap` crate
- [ ] Create frontend UI to display captured screenshots
- [ ] Add cross-platform file storage

**Required Rust dependencies**:
```toml
xcap = "0.0.11"
tauri-plugin-global-shortcut = "2"
base64 = "0.22"
```

### Step 2: Voice Recording 🔄
- [ ] Add audio capture after screenshot
- [ ] Implement WAV file recording using `cpal` and `hound`
- [ ] Create recording UI with start/stop controls
- [ ] Prepare audio for Whisper API

**Required Rust dependencies**:
```toml
cpal = "0.15"
hound = "3.5"
```

### Step 3: AI Integration 📋
- [ ] Secure API key management in Rust backend
- [ ] Implement OpenAI API client
- [ ] Send screenshot + transcript to GPT-4
- [ ] Handle and display AI responses

**Required Rust dependencies**:
```toml
reqwest = { version = "0.12", features = ["json", "multipart"] }
tokio = { version = "1", features = ["full"] }
```

### Step 4: Rich Display 🎨
- [ ] Add Markdown rendering for AI responses
- [ ] Implement syntax highlighting for code blocks
- [ ] Add copy-to-clipboard functionality
- [ ] Create export options (PDF, Markdown)

**Frontend dependencies**:
```bash
bun add marked highlight.js @types/marked
```

### Step 5: Research Agents 🧠
- [ ] Design plugin architecture for agents
- [ ] Implement Product Agent (Amazon analysis)
- [ ] Implement Email Agent (rewriting/composition)
- [ ] Implement Research Agent (web searches)
- [ ] Add agent selection UI

## Code Conventions

### TypeScript
- Use strict TypeScript settings
- Prefer functional components
- Use type imports: `import type { ... }`
- File naming: camelCase for files, PascalCase for components

### Rust
- Follow Rust naming conventions (snake_case)
- Use `Result<T, E>` for error handling
- Implement proper error types
- Use `#[tauri::command]` for frontend-callable functions

### Tauri Commands
Commands should be defined in `src-tauri/src/lib.rs`:
```rust
#[tauri::command]
async fn command_name(param: String) -> Result<String, String> {
    // Implementation
}
```

## Key Files and Directories

```
/home/frank/Shorty/
├── src/                    # Frontend TypeScript code
│   ├── main.ts            # Frontend entry point
│   └── styles.css         # Global styles
├── src-tauri/             # Backend Rust code
│   ├── src/
│   │   ├── main.rs        # Tauri app setup
│   │   └── lib.rs         # Command implementations
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── package.json           # Frontend dependencies
└── README.md             # Project documentation
```

## Security Considerations

1. **API Keys**: Store in Tauri's secure storage, never in frontend
2. **Permissions**: Request necessary permissions in `tauri.conf.json`
3. **CSP**: Currently disabled (`"csp": null`) - configure before production
4. **File Access**: Use Tauri's file system APIs for secure access

## Testing Approach

```bash
# Frontend tests (when implemented)
bun test

# Rust tests
cd src-tauri && cargo test

# Integration tests
# TODO: Set up Tauri testing framework
```

## Common Tasks

### Adding a new Tauri command:
1. Define function in `src-tauri/src/lib.rs` with `#[tauri::command]`
2. Register in `tauri::Builder` in `main.rs`
3. Import and use in frontend with `@tauri-apps/api/core`

### Adding a new dependency:
- **Rust**: Edit `src-tauri/Cargo.toml`, then `cargo build`
- **Frontend**: Use `bun add <package>`

### Debugging:
- Frontend: Browser DevTools in development window
- Backend: Use `println!` or `dbg!` macros, check terminal output
- Enable Rust logging: Set `RUST_LOG=debug`

## Platform-Specific Notes

### Windows
- Requires WebView2 runtime
- Icon format: `.ico`

### macOS
- Requires code signing for distribution
- Icon format: `.icns`
- May need microphone/screen recording permissions

### Linux
- Various desktop environments may behave differently
- Icon format: `.png`
- May need additional system packages

## Current Package Versions
- Tauri: 2.x
- TypeScript: 5.6.2
- Vite: 6.0.3
- Rust edition: 2021

## Notes for AI Assistants

1. Always check existing code patterns before implementing new features
2. Use `bun` for all package management (not npm/yarn)
3. Tauri 2.0 has different APIs than v1 - check documentation
4. Global shortcuts require specific permissions in capabilities
5. File operations should use Tauri's APIs, not Node.js fs module
6. When implementing Step 1, start with basic functionality before adding all features
7. Test on the current platform before assuming cross-platform compatibility