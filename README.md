# Shorty - AI-Powered Desktop Productivity App

## 🎯 Project Overview

Shorty is a cross-platform desktop application built with **Tauri 2.0** and **TypeScript** that provides AI-powered productivity shortcuts. The app captures system audio and clipboard content, then uses **OpenAI APIs** (GPT-4 + Whisper) to provide intelligent analysis and automation.

## 🚀 Current Features

### 1. **Translation Agent** (`cmd+t`)
- Translates clipboard text to selected language using OpenAI GPT-4o-mini
- Streaming translation in popup window
- Supports multiple languages with inline selector
- Real-time translation with typing indicators

### 2. **System Audio Recorder** (`cmd+r`) 
- Records **computer audio** (videos, meetings, music) - NOT microphone
- Converts speech to text using OpenAI Whisper API
- Automatically copies transcription to clipboard
- Toggle recording: press once to start, again to stop

## 🏗️ Architecture

### **Frontend (TypeScript)**
- **Framework**: Vanilla TypeScript with Vite
- **Entry Point**: `src/main.ts`
- **Components**: Modular component system in `src/components/`
- **Services**: Business logic in `src/services/`
- **Agents**: AI agents in `src/agents/` following BaseAgent pattern

### **Backend (Rust)**
- **Framework**: Tauri 2.0
- **Main Files**: 
  - `src-tauri/src/main.rs` - App initialization
  - `src-tauri/src/lib.rs` - Command implementations
- **Audio**: `cpal` crate for system audio capture
- **HTTP**: `reqwest` with multipart support for OpenAI APIs

### **Agent Architecture**
```
BaseAgent (abstract class)
├── TranslatorAgent (cmd+t)
└── AudioRecorderAgent (cmd+r)
```

Each agent follows the pattern:
- `AgentConfig` - name, description, shortcut, enabled status
- `execute(context)` - main execution logic
- Monitored executions tracked in `AgentManager`

## 🔧 Development Setup

### **Prerequisites**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Bun (package manager)
curl -fsSL https://bun.sh/install | bash

# Install Tauri CLI
cargo install tauri-cli --version "^2.0.0"
```

### **Installation**
```bash
# Clone and install dependencies
git clone <repo>
cd Shorty
bun install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-your-key-here
```

### **Development Commands**
```bash
# Start development server (hot reload)
bun run tauri dev

# Build for production
bun run tauri build

# Frontend only (Vite dev server)
bun run dev

# Type checking
bun run build

# Rust tests
cd src-tauri && cargo test
```

## 🎧 System Audio Setup (Required for Audio Recording)

### **macOS Setup**
1. **Install BlackHole**:
   ```bash
   # Download from: https://github.com/ExistentialAudio/BlackHole/releases
   # Install BlackHole.2ch.pkg
   # Restart Mac
   ```

2. **Create Multi-Output Device**:
   - Open **Audio MIDI Setup**
   - Create Multi-Output Device with:
     - ✅ MacBook Pro Speakers  
     - ✅ BlackHole 2ch
   - Set as system output in **System Preferences → Sound**

3. **Verify Setup**: App console should show:
   ```
   🎧 Available Audio Devices:
   - Input: BlackHole 2ch  ← Required for system audio
   ```

### **Windows Setup**
- Install **VB-Audio Virtual Cable** or enable **Stereo Mix**

### **Linux Setup**  
- Use PulseAudio monitor devices (usually available by default)

## 🔑 Environment Variables

Create `.env` file in project root:
```bash
# Required for AI features
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## 📱 Usage

### **Translation**
1. Copy text to clipboard
2. Press `cmd+t`
3. Translation popup appears with streaming translation
4. Select target language from dropdown in feature card

### **System Audio Recording**
1. Play video/audio on your computer
2. Press `cmd+r` → "🎤 Recording started"
3. Let it record speech/audio
4. Press `cmd+r` again → Transcription copied to clipboard

### **Monitoring**
- Switch to "Monitor" tab to see all agent executions
- Real-time status tracking and execution history

## 🗂️ Project Structure

```
Shorty/
├── src/                          # Frontend TypeScript
│   ├── components/               # UI components
│   │   ├── App.ts               # Main app component
│   │   ├── FeatureSection/      # Feature cards
│   │   └── MonitorPage/         # Execution monitoring
│   ├── services/                # Business logic
│   │   ├── AgentManager.ts      # Agent registry & execution
│   │   ├── ShortcutManager.ts   # Global shortcuts
│   │   ├── TranslationService.ts
│   │   └── AudioRecordingService.ts
│   ├── agents/                  # AI agent implementations
│   │   ├── translator/
│   │   └── audio-recorder/
│   ├── types/                   # TypeScript types
│   └── main.ts                  # Entry point
├── src-tauri/                   # Rust backend
│   ├── src/
│   │   ├── main.rs             # Tauri app setup
│   │   └── lib.rs              # Commands (audio, translation)
│   ├── Cargo.toml              # Rust dependencies
│   └── tauri.conf.json         # Tauri configuration
├── translation.html            # Translation popup window
├── .env                        # Environment variables
└── README.md                   # This file
```

## 🔧 Troubleshooting

### **Audio Recording Issues**
```bash
# Check available audio devices in browser console:
🎧 Available Audio Devices:
- Input: BlackHole 2ch  ← Must be present for system audio

# If BlackHole missing:
1. Install BlackHole and restart Mac
2. Verify in System Preferences → Sound
3. Create Multi-Output Device in Audio MIDI Setup
```

### **Clipboard Issues**
- Uses Tauri's clipboard plugin with fallback to browser API
- Check permissions in System Preferences → Security & Privacy

### **OpenAI API Issues**
```bash
# Check API key in backend logs:
✅ OpenAI API key loaded from environment
❌ OpenAI API key not found. Please check your .env file.
```

## 🎯 Current Development Status

### ✅ **Completed Features**
- [x] Translation agent with streaming responses
- [x] System audio recording with speech-to-text
- [x] Global shortcuts (cmd+t, cmd+r)
- [x] Agent monitoring and execution tracking
- [x] Environment variable management
- [x] Cross-platform clipboard support

### 🔄 **Future Enhancements**
- [ ] Screenshot capture agent (cmd+s)
- [ ] Email composition agent
- [ ] Research agent with web search
- [ ] Plugin architecture for custom agents
- [ ] Settings panel for API keys and preferences

## 🤖 AI Assistant Context

**When working on this project, remember:**

1. **Agent Pattern**: All new features should follow the BaseAgent pattern
2. **Tauri Commands**: Backend functions use `#[tauri::command]` and are registered in `main.rs`
3. **Environment Variables**: API keys stored in `.env` and loaded via `dotenvy`
4. **Audio**: System audio capture requires virtual audio drivers (BlackHole on macOS)
5. **Clipboard**: Use Tauri's clipboard plugin, not browser APIs
6. **Monitoring**: All agent executions are automatically tracked by AgentManager
7. **Error Handling**: Comprehensive error handling with user notifications

**Key Files to Modify for New Features:**
- `src/agents/` - Create new agent classes
- `src/components/App.ts` - Register agents and add feature cards
- `src-tauri/src/lib.rs` - Add new Tauri commands if needed
- `src/services/ShortcutManager.ts` - Handle new shortcuts

**Testing Checklist:**
- [ ] Rust compilation: `cargo build`
- [ ] TypeScript compilation: `bun run build`
- [ ] Audio devices detection in console
- [ ] Global shortcuts registration
- [ ] OpenAI API key loading
- [ ] Agent execution monitoring

---

**Last Updated**: July 26, 2025
**Current Version**: 0.1.0
**Platform**: macOS (primary), Windows/Linux (planned)