> 这是简体中文译本，译自 `packages/coding-agent/docs/index.md`。与英文原文如有出入，以原文为准。

# Pi

Pi 是一个可扩展的 AI agent，直接在你的终端里工作。给它一个目标和一个工作目录，它就能检查文件、运行命令、修改内容，并完成多步骤任务。

你可以把 Pi 用于软件开发、研究笔记、写作项目、数据文件或业余项目。你可以直接使用 Pi，也可以让它按你的习惯改造自己，或者用 SDK 把 Pi 嵌进你自己的应用。

## 开始使用 Pi

第一次用 Pi？照 [快速开始](quickstart.md) 走一遍：安装 Pi、连接模型、完成第一个任务。

如果 Pi 已经装好，按你要做的事选：

- [交互式使用 Pi](usage.md)：添加文件、运行命令、指挥正在进行的工作、导出结果。
- [选择模型](models.md)，或接入订阅、API key、本地模型、兼容端点。
- [继续或分叉会话](sessions.md)：恢复之前的工作，或者换个思路探索而不丢历史。
- [配置 Pi](configuration.md)：偏好、工作目录、指令和可复用资源。
- [理解 Pi 如何工作](how-pi-works.md)：工具、上下文、会话和 agent 循环。

## 定制 Pi

Pi 可以复用提示词、加载专用指令、增加可执行的集成、改变终端界面、连接模型服务，并把这些资源打包分发。

用[快速开始里的定制方式选择器](quickstart.md#choose-how-to-customize-pi)挑一个满足需求的最小机制。

## 自动化或嵌入 Pi

- 用 [print 模式](cli.md#invocation-and-output) 处理一次性和脚本化任务。
- 用 [JSON 事件流模式](json.md) 消费一次运行产生的结构化事件。
- 用 [RPC 模式](rpc.md) 控制一个独立的 Pi 进程。
- 用 [TypeScript SDK](sdk.md) 在应用内部运行 Pi。

## 查参考与安装信息

参考页面用来查 [CLI 选项](cli.md)、[设置](settings.md)、[provider](providers.md)、[快捷键](keybindings.md) 和 [环境变量](environment-variables.md)。

平台相关的帮助见[终端配置](terminal-setup.md)、[Windows](windows.md)、[tmux](tmux.md)、[Android 上的 Termux](termux.md) 或[容器化](containerization.md)。

## 安全地工作

Pi 的工具和扩展以 Pi 进程的权限运行。项目信任决定 Pi 加载哪些项目资源，但它不为工具调用提供沙箱。在使用不可信的文件、仓库、扩展或无人值守的自动化之前，先读[安全](security.md)。
