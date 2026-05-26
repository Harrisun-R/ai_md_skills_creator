# AI MD and Skills Creator

A concise, AI-powered CLI tool to generate `CLAUDE.md`, `GEMINI.md`, and `SKILL.md` files for your projects.

## Features

- **Multi-Language Auto-Detection:** Automatically detects project name and dependencies for 11+ ecosystems:
  - **Node.js** (`package.json`)
  - **Python** (`pyproject.toml`, `requirements.txt`)
  - **Rust** (`Cargo.toml`)
  - **Go** (`go.mod`)
  - **Ruby** (`Gemfile`)
  - **PHP** (`composer.json`)
  - **Java/Kotlin** (`pom.xml`, `build.gradle`)
  - **Flutter/Dart** (`pubspec.yaml`)
  - **.NET** (`.csproj`)
  - **Swift** (`Package.swift`)
  - **C++** (`CMakeLists.txt`)
- **Dynamic Suggestions:** Asks context-aware questions and provides AI-driven suggestions.
- **LLM Agnostic:** Works with OpenAI, Anthropic, Google Gemini, and local LLMs (via Ollama or custom OpenAI-compatible endpoints).
- **Concise Output:** Generates lean markdown files to save context window and tokens.
- **Secure:** Keys are managed via environment variables or `.env` files.
- **Dry-Run Mode:** Preview the output before saving.

## Installation

```bash
npm install -g ai-md-creator
```

## Usage

Navigate to your project root and run:

```bash
ai-md
```

### Options

- `-d, --dry-run`: Preview the generated markdown without saving to a file.
- `-v, --version`: Show version number.
- `-h, --help`: Show help.

## Configuration

The tool reads from your environment or a `.env` file in the current directory.

### Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `AI_PROVIDER` | `openai`, `anthropic`, `google`, `ollama`, or `custom` | `openai` |
| `AI_API_KEY` | Your API key (overrides provider-specific keys) | - |
| `AI_MODEL` | The model to use | Provider default |
| `AI_BASE_URL` | Custom API base URL (for Ollama or proxies) | - |
| `OPENAI_API_KEY` | OpenAI specific key | - |
| `ANTHROPIC_API_KEY` | Anthropic specific key | - |
| `GEMINI_API_KEY` | Google Gemini specific key | - |

### Example `.env`

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o
```

## Security

- Your API keys are never stored by the tool; they are only read from your environment.
- Always add `.env` to your `.gitignore`.
- The tool only sends your answers and context to the LLM; it does not scan your entire filesystem.

## License

MIT
