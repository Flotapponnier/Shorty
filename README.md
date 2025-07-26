# Shorty - AI-Powered Shortcut Agent

A cross-platform desktop application built with Tauri and TypeScript that provides instant AI-powered text processing through global shortcuts.

## 🎯 What This App Does

**Global shortcuts → AI processing → Instant results**

1. **Press a global shortcut** → triggers agent execution
2. **Processes clipboard content** → automatically uses copied text
3. **AI analyzes and transforms** → using Groq's free LLM API
4. **Results copied back** → instant access to processed content

Perfect for instant translation, text analysis, or any workflow where you need AI to quickly process text content.

## 🏗️ Architecture

- **Frontend**: TypeScript + Modern Web UI
- **Backend**: Rust (Tauri 2.0)
- **Platforms**: Windows, macOS, Linux
- **AI Integration**: Groq API (Free LLaMA models)

## ✨ Current Features

### ✅ Translation Agent
- **Shortcut**: `Cmd+T` (macOS) / `Ctrl+T` (Windows/Linux)
- **Function**: Translates clipboard content to English (configurable)
- **Usage**: Copy text → Press shortcut → Get translation in clipboard

### 🔄 Coming Soon
- **LLM Agent**: `Cmd+K` - Screenshot analysis with custom prompts
- **Email Agent**: Text rewriting and professional formatting
- **Research Agent**: Content analysis and insights

## 🏗️ Agent Architecture

```
src/
├── agents/                    # Isolated agent modules
│   ├── base/                 # Base agent interface
│   ├── translator/           # Translation agent
│   └── llm/                  # LLM analysis agent
├── services/                 # Core services
│   ├── AgentManager.ts       # Agent lifecycle management
│   ├── ShortcutManager.ts    # Global shortcut handling
│   └── TranslationService.ts # Groq API integration
├── components/               # UI components
│   ├── FeatureSection/       # Feature display cards
│   ├── MonitorPage/          # Execution monitoring
│   └── App.ts               # Main application
└── types/                   # TypeScript interfaces
    └── Agent.ts             # Agent base types
```

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | TypeScript | Type-safe UI development |
| Backend | Rust | System integration & security |
| Framework | Tauri 2.0 | Cross-platform desktop |
| Global Shortcuts | tauri-plugin-global-shortcut | System-wide hotkeys |
| Clipboard | tauri-plugin-clipboard-manager | Clipboard access |
| AI | Groq API | Free LLaMA 3 models |
| HTTP Client | reqwest | API communication |

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd Shorty

# Install dependencies
bun install

# Run in development mode
bun run tauri dev
```

### 2. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up for an account
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-proj-...`)

### 3. Configure API Key

1. Copy the environment file: `cp .env.example .env`
2. Edit `.env` and replace with your actual API key:
   ```bash
   OPENAI_API_KEY=sk-proj-your-actual-api-key-here
   ```
3. The API key will be loaded automatically on startup

### 4. Test Translation

1. Copy any text to your clipboard
2. Press `Cmd+T` (macOS) or `Ctrl+T` (Windows/Linux)
3. Wait for the notification
4. Paste to see the translated text

## 📋 Prerequisites

- **Bun** (latest stable) - [Install Bun](https://bun.sh/)
- **Rust** (latest stable) - [Install Rust](https://rustup.rs/)
- **System permissions** for:
  - Global shortcuts (required for hotkeys)
  - Clipboard access (required for text processing)

## 🔑 Configuration Options

### API Settings
- **API Key**: Loaded from `.env` file for security
- **Target Language**: Configurable (default: German)
- **Model**: Uses OpenAI's GPT-4o-mini model

### Shortcut Customization
Currently using fixed shortcuts:
- `Cmd+T` / `Ctrl+T`: Translation agent

Future versions will support custom shortcut configuration.

## 🎯 Use Cases

### Current Features
- **Language Learning**: Copy foreign text → Instant translation
- **International Communication**: Translate messages before sending
- **Document Translation**: Quick translation of text snippets
- **Content Creation**: Translate content for multilingual audiences

### Future Capabilities
- **Email Enhancement**: Copy drafts → Get professional rewrites
- **Code Analysis**: Copy code → Get explanations and improvements
- **Research Assistance**: Copy articles → Get summaries and insights

## 🖥️ UI Features

### Main Interface
- **Feature Cards**: Clean display of available agents
- **Navigation**: Switch between Features and Monitor views
- **API Configuration**: Secure key input and storage

### Monitoring Dashboard
- **Execution Logs**: Real-time tracking of agent runs
- **Success Metrics**: Visual statistics and performance data
- **Error Handling**: Detailed error messages and debugging info

## 🔒 Privacy & Security

- **Local Storage**: API keys stored in browser localStorage
- **No Telemetry**: Zero data collection or tracking
- **Open Source**: Full transparency in code and functionality
- **Clipboard Only**: Only processes clipboard content when triggered

## 🐛 Troubleshooting

### Common Issues

1. **Shortcut not working**
   - Ensure the app has accessibility permissions (macOS)
   - Check if another app is using the same shortcut
   - Restart the app after permission changes

2. **Translation failing**
   - Verify API key is valid and has credits
   - Check internet connection
   - Ensure clipboard has text content

3. **Build errors**
   ```bash
   # Clean and rebuild
   rm -rf target/ dist/
   bun install
   bun run tauri build
   ```

### Debug Mode
Run with console logging:
```bash
RUST_LOG=debug bun run tauri dev
```

## 🤝 Contributing

### Agent Development
1. Create new agent in `src/agents/your-agent/`
2. Extend `BaseAgent` class
3. Register in `AgentManager`
4. Add to UI feature list

### Architecture Guidelines
- Keep agents isolated and modular
- Use TypeScript interfaces for type safety
- Follow existing naming conventions
- Add comprehensive error handling

## 📄 License

MIT License - feel free to use this in your own projects!

---

**Built with ❤️ using Tauri, Rust, and TypeScript**
