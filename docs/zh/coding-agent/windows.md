> 这是简体中文译本，译自 `packages/coding-agent/docs/windows.md`。与英文原文如有出入，以原文为准。

# 在 Windows 上运行 Pi

Pi 既可以作为原生 Windows 进程运行，也可以在 Windows Subsystem for Linux（WSL）中运行。原生 Windows 默认使用 Git Bash 执行 Bash 命令，并且可以选择向模型提供 PowerShell。在 WSL 中运行的 Pi 使用 Linux 环境及其 Bash 安装。

按照主 [快速开始](quickstart.md) 安装并认证 Pi。使用本页选择并配置其命令环境。

## 选择原生 Windows 还是 WSL

| 环境 | 命令环境 | 适用场景 |
|---|---|---|
| 使用 Git Bash 的原生 Windows | 内置 `bash` 工具和 `!` 命令使用 Git Bash | 你的文件和开发工具主要位于 Windows |
| 使用 `powershell` 工具的原生 Windows | 模型的工具调用使用 PowerShell；`!` 命令仍可使用 Bash | 任务依赖 PowerShell 模块或 Windows 原生命令 |
| WSL | 所选 WSL 发行版内的 Linux Bash 和工具 | 你的文件和工具链已位于 Linux 或 WSL |

## 在原生 Windows 上使用 Git Bash

对大多数原生 Windows 用户来说，安装 [Git for Windows](https://git-scm.com/download/win) 就足够了。

Pi 按以下顺序解析 Bash：

1. `~/.pi/agent/settings.json` 中的 `shellPath`
2. `%ProgramFiles%\Git\bin\bash.exe` 处的 Git Bash
3. `%ProgramFiles(x86)%\Git\bin\bash.exe` 处的 Git Bash
4. `PATH` 上的 `bash.exe`，包括 Cygwin、MSYS2 或旧版 WSL Bash

启动 Pi 并输入以下命令以验证 shell：

```text
!printf 'Bash is working\n'
```

如果 Pi 找不到 Bash，它会报告已检查的位置。安装 Git for Windows，将另一个 Bash 可执行文件放到 `PATH` 上，或配置 `shellPath`。

## 让模型使用 PowerShell

可选的 `powershell` 工具在可用时通过 `pwsh.exe` 运行命令，否则回退到 Windows PowerShell。它使用 `-NoProfile -NonInteractive -ExecutionPolicy Bypass` 启动 PowerShell。由管理员强制执行的执行策略仍可能优先。

PowerShell 的查找按以下顺序检查这些位置：

1. `PATH` 上的 `pwsh.exe`
2. `%ProgramFiles%\PowerShell\7\pwsh.exe`
3. `PATH` 上的 `powershell.exe`
4. `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe`

要将面向模型的 `bash` 工具替换为 `powershell`，请将以下内容添加到 `~/.pi/agent/settings.json`：

```json
{
  "defaultTools": ["read", "powershell", "edit", "write"]
}
```

`["-bash", "+powershell"]` 也能达到同样的效果，同时保留你配置的其他默认工具。

重启 Pi，然后让它运行一条无害的 PowerShell 命令。`!` 和 `!!` 编辑器命令仍然使用 Bash。只有在 Pi 作为原生 Windows 进程运行时，`powershell` 工具才可用。

其他工具组合参见 [设置](settings.md#tools)。

## WSL

Windows 上的 WSL 路径转换以及 WSL 中额外的 Git 分支轮询识别的是 `/mnt/<drive>`，而不是自定义挂载根。

当从 Windows 使用旧版 WSL `bash.exe` 启动器时，Pi 通过 stdin 发送命令，以避免命令行引号问题。

## 使用自定义的 Bash 可执行文件

当 Bash 安装在 Pi 无法自动发现的位置时，设置 `shellPath`：

```json
{
  "shellPath": "C:\\cygwin64\\bin\\bash.exe"
}
```

JSON 使用反斜杠表示转义序列。当你书写带反斜杠的 Windows 路径时，每个反斜杠都要写两次，如上所示。

命令前缀、别名以及完整的 shell 解析行为参见 [配置 shell 命令](shell-aliases.md)。

## 选择终端

Windows 终端通过控制台宿主（conhost）运行 Pi。有些终端捆绑了较新的副本；其他终端使用 Windows 内置的旧版本，后者存在会影响 Pi 的缺陷。

我们推荐 [Windows Terminal](https://aka.ms/terminal)。它始终附带最新的 conhost，Pi 在其中的测试也最充分。

最后更新：2026 年 10 月。

| 终端 | Conhost | 状态 |
|---|---|---|
| [Windows Terminal](https://aka.ms/terminal) | 捆绑，最新 | 推荐 |
| [VS Code](https://code.visualstudio.com)、[Tabby](https://tabby.sh)、[WezTerm](https://wezterm.org) nightly | 捆绑，最新 | 可用 |
| [Alacritty](https://alacritty.org) | 使用内置版本，除非 `alacritty.exe` 旁边存在来自 Windows Terminal 的 `conpty.dll` 和 `OpenConsole.exe` | 仅在存在这些文件时可用 |
| WezTerm 20240203 及更早版本 | 捆绑，旧版 | [已知问题](#known-issues) |
| 经典控制台（不使用 Windows Terminal 的 `cmd.exe` 或 PowerShell）、mintty（Git Bash）、ConEmu、Cmder、[Hyper](https://hyper.is)、Windows OpenSSH | 内置 | [已知问题](#known-issues) |

## 配置 Windows Terminal

Windows Terminal 会保留或重写部分带修饰键的按键。关于配置 `Shift+Enter` 和 `Alt+Enter`，参见 [Windows Terminal](terminal-setup.md#windows-terminal)；关于 Pi 在 Windows 和 WSL 下的快捷键默认值，参见 [快捷键](keybindings.md)。

<a id="known-issues"></a>

## 已知问题

这些问题源自 conhost。Microsoft 已在其源码中修复，但尚未说明内置 conhost 何时会获得这些修复。

| 问题 | 影响 | 解决方案 |
|---|---|---|
| 从全屏切换到普通模式，或在全屏下按 `Ctrl+G`，会导致会话崩溃（[#9186](https://github.com/earendil-works/pi/issues/9186)、[microsoft/terminal#17515](https://github.com/microsoft/terminal/issues/17515)） | 内置 conhost | 使用带最新 conhost 的终端，或用 `--tui-mode regular` 启动 Pi |
| 提示符中出现类似 `;0;rgb:0000/0000/0000` 的文本，且 BEL 会打开外部编辑器（[#10256](https://github.com/earendil-works/pi/issues/10256)） | 位于另一终端之后的内置 conhost：mintty、Windows OpenSSH | 使用带最新 conhost 的终端 |
| 提示符中出现类似 `79` 或 `55` 的片段（[#10717](https://github.com/earendil-works/pi/issues/10717)） | WezTerm 20240203 | 使用 WezTerm nightly |
| 在普通模式下，每次按键都会在新的一行重绘输入行（[#6300](https://github.com/earendil-works/pi/issues/6300)） | 内置 conhost、经典控制台 | 使用全屏模式（默认），或使用带最新 conhost 的终端 |
