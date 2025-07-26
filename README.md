# Desktop Productivity App

A cross-platform desktop application built with Tauri and TypeScript that combines screenshot capture, voice recording, and AI-powered analysis to boost productivity.

## 🎯 What This App Does

**Quick capture → AI analysis → Smart insights**

1. **Press a global shortcut** → captures your entire screen
2. **Record voice context** → adds audio explanation  
3. **AI processes both** → provides intelligent responses
4. **Get actionable insights** → through specialized research agents

Perfect for analyzing products on Amazon, rewriting emails, research tasks, or any workflow where you need AI to understand what you're looking at and what you want to accomplish.

## 🏗️ Architecture

- **Frontend**: TypeScript + Modern Web UI
- **Backend**: Rust (Tauri 2.0)
- **Platforms**: Windows, macOS, Linux
- **AI Integration**: OpenAI API (GPT + Whisper)

## 🚀 Roadmap

### ✅ Step 1: Screenshot Foundation
- Global keyboard shortcuts (e.g., `Ctrl+Shift+C`)
- Full-screen screenshot capture
- Cross-platform display and storage

### 🔄 Step 2: Voice Recording  
- Audio capture after screenshot
- WAV file processing
- OpenAI Whisper integration

### 📋 Step 3: AI Integration
- Send image + transcript to OpenAI
- Secure API key management
- Response processing

### 🎨 Step 4: Rich Display
- Markdown response rendering
- Clean, readable formatting
- Copy/export functionality

### 🧠 Step 5: Research Agents
- **Product Agent**: Amazon price comparisons, reviews analysis
- **Email Agent**: Professional email rewriting and composition  
- **Research Agent**: Deep-dive analysis with web searches
- **Custom Agents**: Modular plugin architecture

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | TypeScript | Type-safe UI development |
| Backend | Rust | System integration & security |
| Framework | Tauri 2.0 | Cross-platform desktop |
| Screenshots | xcap crate | High-performance capture |
| Audio | cpal + hound | Cross-platform recording |
| AI | OpenAI API | GPT-4 + Whisper |
| Display | Markdown rendering | Rich text responses |

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/desktop-productivity-app.git
cd desktop-productivity-app

# Install dependencies
bun install

# Install Tauri CLI
bun add -g @tauri-apps/cli

# Run in development mode
bun run tauri dev

# Build for production
bun run tauri build
```

## 📋 Prerequisites

- **Bun** (latest stable)
- **Rust** (latest stable)
- **System permissions** for:
  - Global shortcuts
  - Screen capture  
  - Microphone access

## 🔑 Configuration

1. **API Keys**: Add your OpenAI API key to the secure backend configuration
2. **Shortcuts**: Customize global shortcuts in settings
3. **Agents**: Configure which research agents to enable

## 🎯 Use Cases

- **E-commerce**: Screenshot product pages, ask "What's the best deal?"
- **Email**: Capture email drafts, say "Make this more professional"
- **Research**: Screenshot articles, ask "Summarize the key points"
- **Code Review**: Capture code, ask "Find potential issues"
- **Design Feedback**: Screenshot designs, get detailed analysis

## 🔒 Privacy & Security

- **Local Processing**: Screenshots and audio stay on your device
- **Secure API**: Keys stored encrypted in Rust backend
- **No Telemetry**: Zero data collection or tracking
- **Open Source**: Full transparency in code and functionality

## 🤝 Contributing

We welcome contributions! Please check out:

- [Project Overview Documentation](docs/project-overview.md)
- [Step 1 Implementation Guide](docs/step1-implementation.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Issue Templates](.github/ISSUE_TEMPLATE/)

## 📄 License

[MIT License](LICENSE) - feel free to use this in your own projects!

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/desktop-productivity-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/desktop-productivity-app/discussions)
- **Documentation**: [Wiki](https://github.com/your-username/desktop-productivity-app/wiki)

---

**Built with ❤️ using Tauri, Rust, and TypeScript**
