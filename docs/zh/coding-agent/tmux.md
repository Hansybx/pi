> 这是简体中文译本，译自 `packages/coding-agent/docs/tmux.md`。与英文原文如有出入，以原文为准。

# 在 tmux 中运行 Pi

Pi 可以在 tmux 内工作，但 tmux 可能将 `Shift+Enter`、`Ctrl+Enter` 和普通的 `Enter` 报告为同一个按键。启用扩展按键，Pi 才能区分它们。

## 检查你的 tmux 版本

```bash
tmux -V
```

对于 tmux 3.5 或更新版本，使用下面推荐的 CSI-u 配置。对于 tmux 3.2 至 3.4，使用旧版本配置。

## 在 tmux 3.5 或更新版本中启用扩展按键

将以下内容添加到 `~/.tmux.conf`：

```tmux
set -g extended-keys on
set -g extended-keys-format csi-u
```

当终端不直接提供 Kitty 键盘协议时，Pi 会请求扩展按键上报。CSI-u 是将带修饰键的按键通过 tmux 转发的最可靠格式。

## 重启 tmux

该配置作用于 tmux 服务器。为确保其生效，请关闭你的 tmux 会话并启动一个新的服务器。

如果你选择从命令行停止服务器，请先保存工作。此命令会终止该服务器管理的每个会话：

```bash
tmux kill-server
tmux
```

## 验证带修饰键的按键

在新的 tmux 会话中启动 Pi，并检查：

1. `Shift+Enter` 在编辑器中插入新行。
2. `Enter` 提交提示。
3. `Alt+Enter` 在 macOS 和 Linux 上排队一条后续消息。Windows 和 WSL 默认使用 `Ctrl+Q`。

如果这些按键仍表现得像普通的 `Enter`，请验证 tmux 之外的终端能否上报带修饰键的按键。参见 [配置你的终端](terminal-setup.md)。

## 使用 tmux 3.2 至 3.4

这些版本支持扩展按键，但不支持 `extended-keys-format csi-u`。只添加：

```tmux
set -g extended-keys on
```

Pi 支持这些版本使用的 xterm `modifyOtherKeys` 格式。重启 tmux 并重复验证步骤。

对于更早的版本，请升级 tmux，或在 tmux 之外使用 Pi，而不要依赖带修饰键的 Enter 快捷键。

## 已知问题

| 问题 | 影响 | 解决方案 |
|---|---|---|
| 启动时编辑器中会出现类似 `c0c/0c0c/0c0c` 的文本（[tmux#4749](https://github.com/tmux/tmux/issues/4749)） | tmux 3.6 | 升级 tmux。更改 Pi 的主题没有帮助。 |
