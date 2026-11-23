> 这是简体中文译本，译自 `packages/coding-agent/docs/cli-integration.md`。与英文原文如有出入，以原文为准。

# CLI 集成

默认情况下，运行 `pi` 会打开交互式终端界面。当输入或输出被管道或重定向时，Pi 改用 print 模式。你也可以为脚本和应用程序显式选择 print、JSON 或 RPC 模式。

四种模式使用相同的 agent、会话、资源与工具。模式决定输入如何进入 Pi、输出如何暴露，以及进程是否保持可用以接收更多命令。

SDK 不是 CLI 模式。它将 agent 直接嵌入 Node.js 或 Bun 进程。当直接访问 TypeScript 比进程边界更合适时，参见 [SDK](sdk.md)。

## 选择模式

| 模式 | 接口 | 生命周期 | 适用场景 |
|---|---|---|---|
| 交互模式 | 终端 UI | 直到用户退出 | 由人直接与 Pi 交互 |
| print | stdout 上的最终文本 | 单次调用 | 脚本需要最终的助手响应 |
| JSON | stdout 上的 JSONL 事件 | 单次调用 | 进程需要某次运行的结构化进度 |
| RPC | JSONL 命令、响应与事件 | 长期运行 | 进程需要双向控制 |

CLI 选项仍独立于模式地选择工作目录、模型、工具、资源与会话持久化。完整的启动选项参见 [命令行](cli.md)。

## print 到 stdout

print 模式运行提供的提示词，将最终的助手文本写入 stdout，然后退出：

```bash
pi --print "Summarize the changes in this repository"
```

当只需要最终文本时使用 print 模式，包括命令替换、管道与一次性任务。中间事件不会暴露。

print 模式将错误写入 stderr。带 `error` 或 `aborted` 停止原因的最终助手响应会产生非零退出状态。在模型输出 token 上限处被截断的响应（`length` 停止原因）仍会将部分文本打印到 stdout，向 stderr 写入警告，并产生非零退出状态。

未显式选择模式时，非 TTY 的 stdin 或 stdout 也会选择 print 模式。这样无需添加 `--print` 即可使用管道输入输出。

## 流式输出 JSON 事件

JSON 模式写入一个会话头，随后以换行分隔的 JSON 写入 agent 与会话事件：

```bash
pi --mode json "Review this repository" > events.jsonl
```

这是结构化事件输出，不是单个 JSON 结果，也不约束模型响应的格式。

所有提示词在进程启动时提供。进程为该次运行流式输出事件，然后退出；它不接受后续命令。

失败或中止的助手响应会出现在事件流中，但本身不会产生非零退出状态。当成功或失败很重要时，请检查事件。如果调用抛出错误，Pi 仍会以非零状态退出。

流式 `message_update` 记录包含增量，而不是不断增长的消息快照。请根据增量事件拼接实时输出，然后用 `message_end` 中的权威消息替换它。

`agent_end` 之后可能还有自动恢复或排队的工作。`agent_settled` 标记当前运行自动工作的结束。

stdout 保留给 JSONL。诊断信息与应用日志写入 stderr。关于分帧、事件结构与重建规则，参见 [JSON 事件流](json.md)。

## 用 RPC 控制 Pi

RPC 模式让 Pi 保持运行，由另一个进程发送命令并接收响应与事件：

```bash
pi --mode rpc --no-session
```

命令是写入 stdin 的 JSON 对象。响应与事件是写入 stdout 的 JSON 对象。每条记录占一行。

为需要关联的命令添加 `id`。匹配的响应会重复该 ID。事件通常没有命令 ID，因为它们描述的是会话活动而非单个请求。

成功的 `prompt` 响应表示提示词已被接受、排队或处理。它不表示运行已完成。当完成状态很重要时，请持续消费事件直到 `agent_settled`。

RPC 命令可以切换模型、检查状态、管理会话、运行 shell 命令，并响应扩展 UI 请求。

扩展对话框构成请求-响应子协议。其他扩展 UI 更新是通知，客户端可以显示或忽略。仅限 TUI 的扩展能力在交互模式之外不可用或会降级。

对于 Node.js 或 TypeScript 集成，优先使用 `@earendil-works/pi-coding-agent` 中的 `RpcClient`。它会启动 Pi RPC 子进程、关联请求、暴露带类型的命令方法，并将会话事件投递给监听器。

[RPC 客户端示例](../../../packages/coding-agent/examples/rpc-client.ts) 发送一个提示词，流式输出文本与工具活动，等待 `agent_settled`，然后关闭子进程。它已纳入仓库的 TypeScript 检查。

`RpcClient.promptAndWait()` 在发送提示词之前安装事件监听器，避免与快速完成产生竞态。对于分开的操作，请在调用 `prompt()` 之前订阅，并且只在运行处于活动状态时调用 `waitForIdle()`。

该客户端需要指向可运行的 Pi CLI 路径。仓库示例指向 `dist/cli.js`，因此从检出目录运行该示例前必须先构建包。

如果你在不使用 `RpcClient` 的情况下构建客户端，请从 [RPC 协议](rpc.md) 开始，然后将 [RPC 命令](rpc-commands.md) 与 [JSON 事件流](json.md) 作为协议参考。

## fork 与重命名 Pi

源码 fork 可以通过 `package.json` 更改 CLI 名称与配置目录：

```json
{
  "piConfig": {
    "name": "my-agent",
    "configDir": ".my-agent"
  }
}
```

修改顶层 `bin` 字段可设置可执行文件名称。这些设置会影响 CLI 横幅、配置路径以及派生的环境变量名。

## 示例与参考

- [RPC 客户端](../../../packages/coding-agent/examples/rpc-client.ts)：带类型的 Node.js 集成
- [RPC 扩展 UI](../../../packages/coding-agent/examples/rpc-extension-ui.ts)：带扩展对话框的自定义终端客户端
- [命令行](cli.md)：启动选项与模式选择
- [JSON 事件流](json.md)：JSON 事件参考
- [RPC 协议](rpc.md)：RPC 生命周期、分帧、错误与关闭
- [RPC 命令](rpc-commands.md)：命令与响应参考
- [RPC 扩展 UI](rpc-extension-ui.md)：扩展交互子协议
- [SDK 示例](../../../packages/coding-agent/examples/sdk/)：进程内 TypeScript 集成