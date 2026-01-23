# Installing Harvey

Harvey is a CLI application for long-running AI conversations with intelligent context management.

## Prerequisites

Before installing Harvey, ensure you have the following:

- **fzf** - Required for fuzzy chat search functionality
  - macOS: `brew install fzf`
  - Linux (Debian/Ubuntu): `apt install fzf`
  - Linux (Fedora/RHEL): `yum install fzf`
  - Or from source: [fzf GitHub](https://github.com/junegunn/fzf#installation)

- **OpenAI API Key** - Required for AI conversations
  - Get yours at [platform.openai.com](https://platform.openai.com/api-keys)

- **Terminal with UTF-8 support** - For proper display of the TUI

## Installation Methods

### Method 1: Download Binary (Recommended)

Download a pre-built binary from the [GitHub Releases](https://github.com/h14h/harvey/releases) page.

#### Linux (x64)

```bash
# Download
wget https://github.com/h14h/harvey/releases/download/v0.1.0/harvey-0.1.0-linux-x64.tar.gz

# Extract
tar -xzf harvey-0.1.0-linux-x64.tar.gz

# Install
sudo mv harvey /usr/local/bin/
```

#### macOS (Intel)

```bash
# Download
curl -L https://github.com/h14h/harvey/releases/download/v0.1.0/harvey-0.1.0-darwin-x64.tar.gz -o harvey.tar.gz

# Extract
tar -xzf harvey.tar.gz

# Install
sudo mv harvey /usr/local/bin/
```

#### macOS (Apple Silicon)

```bash
# Download
curl -L https://github.com/h14h/harvey/releases/download/v0.1.0/harvey-0.1.0-darwin-arm64.tar.gz -o harvey.tar.gz

# Extract
tar -xzf harvey.tar.gz

# Install
sudo mv harvey /usr/local/bin/
```

#### Windows (x64)

```powershell
# Download from https://github.com/h14h/harvey/releases/download/v0.1.0/harvey-0.1.0-windows-x64.zip

# Extract the ZIP file
# Move harvey.exe to a directory in your PATH
```

#### Verifying Checksums

To verify the integrity of your download:

```bash
# Download checksums
wget https://github.com/h14h/harvey/releases/download/v0.1.0/checksums.txt

# Verify (Linux/macOS)
shasum -a 256 -c checksums.txt
```

### Method 2: Install via Bun

If you have [Bun](https://bun.sh/) installed:

```bash
bun install -g harvey
```

Or install from source:

```bash
git clone https://github.com/h14h/harvey
cd harvey
bun install
bun run build
```

### Method 3: Build from Source

Build Harvey from source for full control:

```bash
# Clone the repository
git clone https://github.com/h14h/harvey
cd harvey

# Install dependencies
bun install

# Run tests (optional)
bun test

# Run directly
bun run start

# Or build an executable
bun run build
```

#### Building for Different Platforms

The build script supports cross-compilation:

```bash
# Build all platforms
bun run build

# Build with specific version
VERSION=1.0.0 bun run build

# Custom output directory
OUT_DIR=artifacts bun run build
```

Built artifacts are placed in the `dist/` directory.

## Post-Install Setup

### First Run

On first run, Harvey will create the configuration directory:

```
~/.local/share/harvey/
├── harvey.db          # SQLite database
└── config.json        # Configuration file
```

### Adding Your OpenAI API Key

Harvey needs your OpenAI API key to function. Add it to your config:

**Option 1: Environment Variable (Recommended)**

```bash
export OPENAI_API_KEY="sk-..."
```

Add this to your `~/.bashrc`, `~/.zshrc`, or equivalent:

```bash
echo 'export OPENAI_API_KEY="sk-..."' >> ~/.bashrc
source ~/.bashrc
```

**Option 2: Configuration File**

Edit `~/.local/share/harvey/config.json`:

```json
{
  "openai_api_key": "sk-..."
}
```

### Setting a Global Tone (Optional)

Set a default personality for all conversations:

```bash
harvey
# Press 't' in normal mode
# Enter your global tone, e.g., "You are a helpful coding assistant"
```

## Platform-Specific Notes

### macOS

If you get a "cannot be opened because the developer cannot be verified" message:

```bash
xattr -cr /usr/local/bin/harvey
```

### Linux

Ensure you have the necessary permissions:

```bash
chmod +x /usr/local/bin/harvey
```

### Windows

- Use PowerShell or Windows Terminal for the best experience
- WSL (Windows Subsystem for Linux) is recommended for better compatibility

### Terminals

Harvey works best with terminals that support:
- UTF-8 encoding
- True color
- Alternative screen buffer

Recommended terminals:
- **macOS**: iTerm2, Terminal.app
- **Linux**: gnome-terminal, alacritty, kitty
- **Windows**: Windows Terminal, WezTerm

## Troubleshooting

### "fzf not found" error

Install fzf:
- macOS: `brew install fzf`
- Linux: `apt install fzf` or `yum install fzf`

### "OpenAI API key not found" error

Set your API key:
```bash
export OPENAI_API_KEY="sk-..."
```

### TUI rendering issues

Try a different terminal or ensure UTF-8 support:
```bash
export LANG=en_US.UTF-8
```

## Getting Started

After installation, run Harvey:

```bash
harvey
```

Keybinds:
- `n` - New chat
- `/` - Search chats (requires fzf)
- `i` - Enter insert mode (type message)
- `Esc` - Return to normal mode
- `q` - Quit

For more information, see the [full documentation](https://github.com/h14h/harvey/wiki).
