> 这是简体中文译本，译自 `packages/coding-agent/docs/terminal-setup.md`。与英文原文如有出入，以原文为准。

# 配置你的终端

大多数现代终端无需额外设置即可与 Pi 配合工作。当带修饰键的按键、滚动、链接、图像、颜色或输入法编辑器（IME）的定位不符合预期时，请使用本页。

Pi 使用扩展按键协议，使终端能够将 `Shift+Enter` 和 `Alt+Enter` 之类的组合与普通的 `Enter` 区分开。终端代理、多路复用器和 IDE 内置终端可能会更改或丢弃该信息。

## 故障排查

| 现象 | 从这里开始 |
|---|---|
| `Shift+Enter` 提交而不是插入新行 | 下面相应终端的章节；对于 tmux，参见 [在 tmux 中运行 Pi](tmux.md) |
| `Alt+Enter` 不排队后续消息 | [WezTerm](#wezterm)、[Alacritty](#alacritty) 或 [Windows Terminal](#windows-terminal) |
| 全屏滚动异常缓慢 | [iTerm2](#iterm2) |
| 链接可用但不显示悬停预览 | [Ghostty](#ghostty) |
| 未检测到内联图像或颜色 | [覆盖检测到的能力](#override-detected-capabilities) |
| IME 候选窗出现在错误的位置 | [WezTerm](#wezterm) 或 [IntelliJ IDEA](#intellij-idea-integrated-terminal) |
| 仅在 tmux 内带修饰键的按键失效 | [在 tmux 中运行 Pi](tmux.md) |

使用 `/hotkeys` 查看 Pi 当前生效的快捷键。要更改它们，参见 [快捷键](keybindings.md)。

## Kitty

Kitty 无需额外配置即支持所需的键盘协议。

## iTerm2

普通终端模式无需额外配置即可工作。

### 修复全屏滚动缓慢

在全屏模式下，Pi 拥有视口，因此 iTerm2 发送的是鼠标滚轮报告，而不是滚动终端原生的历史记录。此时快速的触控板手势每次只能移动大约一行。

要更改此行为：

1. 打开 **iTerm2 > Settings > Advanced**。
2. 搜索 **Trackpad scrolls fast?**。
3. 将其设置为 **No**。

这是 iTerm2 的全局设置，也可能改变原生的触控板滚动。底层行为记录在 [iTerm2 issue 9619](https://gitlab.com/gnachman/iterm2/-/work_items/9619)。

## Apple Terminal

Pi 在可用时启用增强按键上报。如果 Terminal.app 对 `Shift+Enter` 仍发送普通的 Return 或 `ESC` + Return，Pi 会使用本地 macOS 修饰键回退，并将其视为 `Shift+Enter`。未按住 Shift 的 `ESC` + Return 仍保持为 `Alt+Enter`。

该回退仅在 Pi 与 Terminal.app 运行于同一台 Mac 时有效。当 Pi 通过 SSH 运行在另一台机器上时，它无法检查本地修饰键状态。

## Ghostty

如果 `Alt+Backspace` 无效，请将以下映射添加到 Ghostty 的配置中：

```text
keybind = alt+backspace=text:\x1b\x7f
```

配置文件在 macOS 上位于 `~/Library/Application Support/com.mitchellh.ghostty/config`，在 Linux 上位于 `~/.config/ghostty/config`。

较旧的 Claude Code 配置可能包含：

```text
keybind = shift+enter=text:\n
```

这会发送原始的换行符（linefeed），Pi 无法将其与 `Ctrl+J` 区分开。如果添加该映射的唯一原因是旧的 Claude Code 安装，请将其移除。Pi 已将 `Ctrl+J` 绑定为换行的替代方式，因此该映射可能看似有效，却仍然会阻止 Pi 和 tmux 收到真正的 `Shift+Enter` 事件。

### 在全屏模式下打开链接

在全屏模式下链接仍可点击，但当 Pi 捕获鼠标输入时，Ghostty 不会显示其正常的悬停下划线或 URL 预览。在 macOS 上按住 `Shift+Command`，在 Linux 上按住 `Shift+Ctrl`，即可使用 Ghostty 原生的链接处理。

## WezTerm

WezTerm 通常通过 xterm 扩展按键上报 `Shift+Enter`。要显式启用 Kitty 键盘协议，请创建 `~/.wezterm.lua`：

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder()
config.enable_kitty_keyboard = true
return config
```

### 在 macOS 上转发 Alt+Enter

WezTerm 在 macOS 上默认将 `Option+Enter` 绑定为全屏。要将其用于 Pi 的后续消息队列，请将以下条目添加到你的 `config.keys` 表中：

```lua
{
  key = 'Enter',
  mods = 'ALT',
  action = wezterm.action.SendString('\x1b[13;3u'),
}
```

完整的最小配置为：

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder()
config.keys = {
  {
    key = 'Enter',
    mods = 'ALT',
    action = wezterm.action.SendString('\x1b[13;3u'),
  },
}
return config
```

### 在 WSL 中定位 IME 候选窗

如果 CJK 输入法的候选窗在 WSL 中不跟随 Pi 的文本光标，请显示硬件光标：

```bash
export PI_HARDWARE_CURSOR=1
pi
```

你也可以在 Pi 设置中将 `showHardwareCursor` 设置为 `true`。

## Alacritty

Alacritty 通常会上报 `Shift+Enter`。在 macOS 上，`Option+Enter` 可能以普通 `Enter` 到达。将以下内容添加到 `~/.config/alacritty/alacritty.toml`，以将其转发给 Pi：

```toml
[[keyboard.bindings]]
key = "Enter"
mods = "Alt"
chars = "\u001b[13;3u"
```

更改文件后重启 Alacritty。

## VS Code 内置终端

VS Code 1.109.5 及更新版本默认在内置终端中启用 Kitty 键盘协议。

对于更旧的版本，请在 `keybindings.json` 中添加 `Shift+Enter` 终端绑定：

```json
{
  "key": "shift+enter",
  "command": "workbench.action.terminal.sendSequence",
  "args": { "text": "\u001b[13;2u" },
  "when": "terminalFocus"
}
```

用户 `keybindings.json` 文件通常位于：

- macOS：`~/Library/Application Support/Code/User/keybindings.json`
- Linux：`~/.config/Code/User/keybindings.json`
- Windows：`%APPDATA%\\Code\\User\\keybindings.json`

## Zed 内置终端

将以下绑定添加到 Zed 的 `keymap.json`：

```json
{
  "context": "Terminal",
  "bindings": {
    "shift-enter": ["terminal::SendText", "\u001b[13;2u"],
    "ctrl--": ["terminal::SendText", "\u001b[45;5u"],
    "ctrl-alt-]": ["terminal::SendText", "\u001b[93;7u"]
  }
}
```

## Windows Terminal

Windows Terminal 使用 Pi 在 Windows 和 WSL 下的快捷键默认值。完整列表参见 [快捷键](keybindings.md)。

### 转发 Shift+Enter

当 Pi 在 Windows 上原生运行时，它会检查本地 Shift 键状态，并在按住 Shift 时将普通 Return 或 `ESC` + Return 视为 `Shift+Enter`。该回退在 WSL 中或通过 SSH 运行时无效。如果 `Shift+Enter` 仍会提交，请显式转发它。

使用 `Ctrl+Shift+,` 或 **Settings > Open JSON file** 打开 Windows Terminal 的 `settings.json`。将以下对象添加到其 `actions` 数组中：

```json
{
  "command": { "action": "sendInput", "input": "\u001b[13;2u" },
  "keys": "shift+enter"
}
```

完全关闭并重新打开 Windows Terminal，然后验证 `Shift+Enter` 是否在 Pi 中插入新行。

### 使用 Alt+Enter 发送后续消息

Windows Terminal 默认将 `Alt+Enter` 绑定为全屏。因此 Pi 在 Windows 和 WSL 上使用 `Ctrl+Q` 发送后续消息。

要改用 `Alt+Enter`，请配置 Windows Terminal 转发该按键，并在 Pi 的 `keybindings.json` 中将 `app.message.followUp` 绑定到 `alt+enter`。参见 [快捷键](keybindings.md#assign-keybindings)。

## xfce4-terminal 和 Terminator

这些终端无法可靠地将带修饰键的 Enter 与普通 `Enter` 区分开。因此 `Ctrl+Enter` 或 `Shift+Enter` 之类的自定义绑定可能无效。

当你需要这些快捷键时，请使用支持现代扩展按键的终端，例如 Kitty、Ghostty、WezTerm、iTerm2、Windows Terminal，或兼容的 Alacritty 构建。

<a id="intellij-idea-integrated-terminal"></a>

## IntelliJ IDEA 内置终端

IntelliJ IDEA 的内置终端无法可靠地将 `Shift+Enter` 与普通 `Enter` 区分开。请使用 `Ctrl+J` 换行，或在支持现代扩展按键的终端中运行 Pi。

如果 IME 候选窗不跟随文本光标，请显示硬件光标：

```bash
export PI_HARDWARE_CURSOR=1
pi
```

<a id="override-detected-capabilities"></a>

## 覆盖检测到的能力

Pi 会自动检测 OSC 8 超链接、内联图像协议和 truecolor 支持。终端代理或多路复用器可能使该检测不准确。

| 能力 | 环境变量 | 设置 |
|---|---|---|
| 超链接 | `PI_HYPERLINKS=1\|0\|auto` | `terminal.hyperlinks: true\|false\|"auto"` |
| 内联图像 | `PI_IMAGE_PROTOCOL=kitty\|iterm2\|none\|auto` | `terminal.images: "kitty"\|"iterm2"\|false\|"auto"` |
| Truecolor | `PI_TRUE_COLOR=1\|0\|auto` | `terminal.trueColor: true\|false\|"auto"` |

设置优先于环境变量。未设置的值或 `auto` 会保留自动检测。

仅强制使用完整终端路径所支持的能力。不支持的转义序列可能破坏渲染。规范的值定义参见 [环境变量](environment-variables.md#pi-process-configuration) 和 [设置](settings.md)。

## 程序状态

Pi 通过 [Program Status Protocol (OSC 7501)](https://www.superlogical.com/rex/docs/build/program-status) 报告其状态，使终端和 agent 仪表盘能够显示它正在工作、正在等待你、已完成或已失败：

| 状态 | 时机 |
|---|---|
| `working` | agent 运行或压缩（compaction）正在进行。消息为会话名称。 |
| `blocked` | 扩展对话框或登录正在等待你。消息为对话框标题。 |
| `done` | 一次运行已结束。消息为会话名称。 |
| `error` | 一次运行因未重试的错误而结束。消息为错误的第一行。 |
| `idle` | Pi 已启动，或你取消了运行。 |

报告绝不包含提示或模型输出。Pi 仅在终端应答协议的支持查询后才发送它们；tmux 和 screen 不会转发它们。设置 `PI_PROGRAM_STATUS=1` 可在不询问的情况下发送报告，设置 `PI_PROGRAM_STATUS=0` 可将其关闭。
