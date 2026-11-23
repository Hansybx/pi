> 这是简体中文译本，译自 `packages/coding-agent/docs/shell-aliases.md`。与英文原文如有出入，以原文为准。

# 配置 shell 命令

Pi 会为每条 Bash 命令启动一个独立的非交互式 shell 进程。非交互式 Bash 默认不展开别名，通常也不会加载与交互式终端相同的启动文件。

使用 `shellPath` 选择 Bash 可执行文件，使用 `shellCommandPrefix` 在每条命令之前运行初始化设置。

## 了解 Pi 使用哪个 shell

| 命令来源 | shell |
|---|---|
| 模型调用内置 `bash` 工具 | Pi 解析出的 Bash 可执行文件 |
| 你输入 `!command` 或 `!!command` | 同一个解析出的 Bash 可执行文件 |
| 模型调用可选的 `powershell` 工具 | PowerShell 7（`pwsh.exe`）或 Windows PowerShell |
| 扩展提供或替换 shell 工具 | 由该扩展实现的操作 |

Pi 通常使用 `bash -c` 调用 Bash。在 Unix 系统上，它先使用 `/bin/bash`，再使用 `PATH` 上的 `bash`，当 Bash 不可用时最后使用 `sh`。原生 Windows 先检查已配置的路径，然后是 Git Bash，最后是 `PATH` 上的 `bash.exe`。

## 选择 Bash 可执行文件

当 Pi 应使用某个特定的可执行文件时，在 `~/.pi/agent/settings.json` 中设置 `shellPath`：

```json
{
  "shellPath": "~/.local/bin/bash"
}
```

在 Windows 上，使用正斜杠或转义反斜杠：

```json
{
  "shellPath": "C:\\cygwin64\\bin\\bash.exe"
}
```

更改设置后运行 `/reload`。原生 Windows 的默认值参见 [在 Windows 上运行 Pi](windows.md)。

## 在每条 Bash 命令前运行设置

设置 `shellCommandPrefix`，为内置 `bash` 工具以及用户输入的 `!` 或 `!!` 命令前置 shell 设置：

```json
{
  "shellCommandPrefix": "export CI=1"
}
```

Pi 用换行符连接前缀和所请求的命令。前缀会为每条命令重新运行，因此请保持其快速且不含交互式提示。

## 启用 Bash 别名

将 Pi 需要的别名存放在一个 Bash 兼容的文件中，而不是解析整个交互式 shell 配置。

创建 `~/.bash_aliases`：

```bash
alias ll='ls -la'
alias gs='git status --short'
```

然后配置 Pi 以启用别名展开并加载该文件：

```json
{
  "shellCommandPrefix": "shopt -s expand_aliases\nsource ~/.bash_aliases"
}
```

运行 `/reload`，然后通过 Pi 验证别名：

```text
!ll
```

该命令应产生与 `ls -la` 相同的列表。

别名必须使用 Bash 兼容语法。不要将任意的 `.zshrc` source 到 Bash 中，因为 zsh 的选项、函数和插件在那里可能无法解析或行为不正确。

## 故障排查

### 前缀对 `!` 有效，但对扩展工具无效

`shellCommandPrefix` 配置的是 Pi 的内置 Bash 执行。替换 `bash` 工具或提供自身 shell 操作的扩展控制自己的设置。请查阅该扩展的文档。

### 找不到 `shopt`

Pi 已回退到 `sh`，或者 `shellPath` 指向的不是 Bash。在使用 `shopt` 这类 Bash 专有设置之前，请安装 Bash 或将 `shellPath` 设置为 Bash 可执行文件。

### 某条设置命令等待输入

从 `shellCommandPrefix` 中移除交互式命令。前缀会在每条 Bash 命令之前在非交互式进程中运行。

完整的设置定义参见 [Shell 设置](settings.md#shell)。
