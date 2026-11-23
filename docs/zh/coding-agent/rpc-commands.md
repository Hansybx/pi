> 这是简体中文译本，译自 `packages/coding-agent/docs/rpc-commands.md`。与英文原文如有出入，以原文为准。

# RPC 命令

本文档列出 [RPC 模式](rpc.md)下 stdin 接受的命令。每条命令和每个响应都是一个 JSON 对象。共用的消息取值使用[消息类型](message-types.md)。

## 发送提示

### prompt

向 agent 发送用户提示。命令响应在提示被接受、排队或处理之后发出。接受之后，事件会继续异步流式输出。

```json
{"id": "req-1", "type": "prompt", "message": "Hello, world!"}
```

带图片时：
```json
{"type": "prompt", "message": "What's in this image?", "images": [{"type": "image", "data": "base64-encoded-data", "mimeType": "image/png"}]}
```

**流式输出期间**：如果 agent 已经在流式输出，你必须指定 `streamingBehavior` 才能把消息排队：

```json
{"type": "prompt", "message": "New instruction", "streamingBehavior": "steer"}
```

- `"steer"`：在 agent 运行时把消息排队。它会在当前 assistant 轮次执行完其工具调用之后、下一次 LLM 调用之前投递。
- `"followUp"`：等到 agent 结束。只有在 agent 停止时才投递消息。

如果 agent 正在流式输出且未指定 `streamingBehavior`，该命令会返回错误。

**扩展命令**：如果消息是扩展命令（例如 `/mycommand`），它会立即执行，即使在流式输出期间也是如此。扩展命令通过 `pi.sendMessage()` 自行管理与 LLM 的交互。

**输入展开**：技能命令（`/skill:name`）和提示模板（`/template`）在发送/排队之前会被展开。

响应：
```json
{"id": "req-1", "type": "response", "command": "prompt", "success": true, "data": {"disposition": "started"}}
```

如果扩展命令或输入处理器消费了该提示，`data.disposition` 为 `"handled"`；如果 Pi 在运行期间将其排队，则为 `"queued"`；如果 Pi 接受它以启动一次运行，则为 `"started"`。这描述的是所提交的提示，而不是扩展启动的独立工作，也不保证完成。

`success: true` 表示提示已被接受、排队或立即处理。`success: false` 表示提示在接受之前被拒绝。接受之后的失败会通过常规的事件流和消息流报告，而不是为同一请求 id 返回第二个 `response`。

`images` 字段是可选的。每张图片使用 `ImageContent` 格式：`{"type": "image", "data": "base64-encoded-data", "mimeType": "image/png"}`。

### steer

在 agent 运行时把引导消息排队。它会在当前 assistant 轮次执行完其工具调用之后、下一次 LLM 调用之前投递。技能命令和提示模板会被展开。不允许使用扩展命令（请改用 `prompt`）。

```json
{"type": "steer", "message": "Stop and do this instead"}
```

带图片时：
```json
{"type": "steer", "message": "Look at this instead", "images": [{"type": "image", "data": "base64-encoded-data", "mimeType": "image/png"}]}
```

`images` 字段是可选的。每张图片使用 `ImageContent` 格式（与 `prompt` 相同）。

响应：
```json
{"type": "response", "command": "steer", "success": true, "data": {"disposition": "queued"}}
```

如果输入处理器消费了这条引导消息，`data.disposition` 为 `"handled"`；如果 Pi 将其排队，则为 `"queued"`（包括处理器转换之后的情况）。它不保证该消息会一直留在队列中。

关于如何控制引导消息的处理方式，见 [set_steering_mode](#set_steering_mode)。

### follow_up

排入一条在 agent 结束后处理的后续消息。只有在 agent 没有更多工具调用或引导消息时才投递。技能命令和提示模板会被展开。不允许使用扩展命令（请改用 `prompt`）。

```json
{"type": "follow_up", "message": "After you're done, also do this"}
```

带图片时：
```json
{"type": "follow_up", "message": "Also check this image", "images": [{"type": "image", "data": "base64-encoded-data", "mimeType": "image/png"}]}
```

`images` 字段是可选的。每张图片使用 `ImageContent` 格式（与 `prompt` 相同）。

响应：
```json
{"type": "response", "command": "follow_up", "success": true, "data": {"disposition": "queued"}}
```

`data.disposition` 的含义与 `steer` 的 `"handled"` 或 `"queued"` 相同，只是作用于这条后续消息。

关于如何控制后续消息的处理方式，见 [set_follow_up_mode](#set_follow_up_mode)。

### abort

中止当前操作，并等待会话变为空闲后再响应。

```json
{"type": "abort"}
```

响应：
```json
{"type": "response", "command": "abort", "success": true}
```

### clear_queue

移除已排队的引导消息和后续消息，并返回它们的文本。

```json
{"type": "clear_queue"}
```

响应：
```json
{
  "type": "response",
  "command": "clear_queue",
  "success": true,
  "data": {
    "steering": ["Change direction"],
    "followUp": ["Summarize when finished"]
  }
}
```

要实现交互模式下的 Esc 行为，请在 `abort` 之前发送 `clear_queue`，然后在客户端编辑器中恢复返回的文本。当排队消息仍留在会话中时，`abort` 会继续处理它们。

### new_session

启动一个全新的会话。可被 `session_before_switch` 扩展事件处理器取消。

```json
{"type": "new_session"}
```

带可选的父会话跟踪：
```json
{"type": "new_session", "parentSession": "/path/to/parent-session.jsonl"}
```

响应：
```json
{"type": "response", "command": "new_session", "success": true, "data": {"cancelled": false}}
```

如果扩展取消了：
```json
{"type": "response", "command": "new_session", "success": true, "data": {"cancelled": true}}
```

## 状态

### get_state

获取当前会话状态。

```json
{"type": "get_state"}
```

响应：
```json
{
  "type": "response",
  "command": "get_state",
  "success": true,
  "data": {
    "model": {...},
    "thinkingLevel": "medium",
    "isStreaming": false,
    "isCompacting": false,
    "steeringMode": "all",
    "followUpMode": "one-at-a-time",
    "sessionFile": "/path/to/session.jsonl",
    "sessionId": "abc123",
    "sessionName": "my-feature-work",
    "autoCompactionEnabled": true,
    "messageCount": 5,
    "pendingMessageCount": 0
  }
}
```

`model` 字段是完整的 [Model](#model-object) 对象，未选择模型时省略。`sessionName` 字段是通过 `set_session_name` 设置的显示名称，未设置时省略。

### get_messages

获取会话中的所有消息。

```json
{"type": "get_messages"}
```

响应：
```json
{
  "type": "response",
  "command": "get_messages",
  "success": true,
  "data": {"messages": [...]}
}
```

消息是 `AgentMessage` 对象（见[消息类型](message-types.md)）。

## 模型

### set_model

切换到指定模型。

```json
{"type": "set_model", "provider": "anthropic", "modelId": "claude-sonnet-4-20250514"}
```

响应包含完整的 [Model](#model-object) 对象：
```json
{
  "type": "response",
  "command": "set_model",
  "success": true,
  "data": {...}
}
```

### cycle_model

循环切换到下一个可用模型。如果只有一个可用模型，返回 `null` 数据。

```json
{"type": "cycle_model"}
```

响应：
```json
{
  "type": "response",
  "command": "cycle_model",
  "success": true,
  "data": {
    "model": {...},
    "thinkingLevel": "medium",
    "isScoped": false
  }
}
```

`model` 字段是完整的 [Model](#model-object) 对象。

### get_available_models

列出所有已配置的模型。

```json
{"type": "get_available_models"}
```

响应包含一个由完整 [Model](#model-object) 对象组成的数组：
```json
{
  "type": "response",
  "command": "get_available_models",
  "success": true,
  "data": {
    "models": [...]
  }
}
```

## 思考

### set_thinking_level

为支持该功能的模型设置推理/思考级别。

```json
{"type": "set_thinking_level", "level": "high"}
```

级别：`"off"`、`"minimal"`、`"low"`、`"medium"`、`"high"`、`"xhigh"`、`"max"`

`"xhigh"` 和 `"max"` 仅在所选模型支持时才可用。包括 GPT-5.6 在内的一些模型两者都提供。

响应：
```json
{"type": "response", "command": "set_thinking_level", "success": true}
```

### cycle_thinking_level

在可用的思考级别之间循环切换。如果模型不支持思考，返回 `null` 数据。

```json
{"type": "cycle_thinking_level"}
```

响应：
```json
{
  "type": "response",
  "command": "cycle_thinking_level",
  "success": true,
  "data": {"level": "high"}
}
```

### get_available_thinking_levels

列出当前模型支持的思考级别。对于不支持推理的模型，返回 `["off"]`。

```json
{"type": "get_available_thinking_levels"}
```

响应：
```json
{
  "type": "response",
  "command": "get_available_thinking_levels",
  "success": true,
  "data": {
    "levels": ["off", "minimal", "low", "medium", "high"]
  }
}
```

## 队列模式

### set_steering_mode

控制引导消息（来自 `steer`）的投递方式。

```json
{"type": "set_steering_mode", "mode": "one-at-a-time"}
```

模式：
- `"all"`：在当前 assistant 轮次执行完其工具调用后投递所有引导消息
- `"one-at-a-time"`：每完成一个 assistant 轮次投递一条引导消息（默认）

响应：
```json
{"type": "response", "command": "set_steering_mode", "success": true}
```

### set_follow_up_mode

控制后续消息（来自 `follow_up`）的投递方式。

```json
{"type": "set_follow_up_mode", "mode": "one-at-a-time"}
```

模式：
- `"all"`：在 agent 结束时投递所有后续消息
- `"one-at-a-time"`：每次 agent 完成投递一条后续消息（默认）

响应：
```json
{"type": "response", "command": "set_follow_up_mode", "success": true}
```

## 压缩（compaction）

### compact

手动压缩会话上下文以减少 token 用量。

```json
{"type": "compact"}
```

带自定义指令时：
```json
{"type": "compact", "customInstructions": "Focus on code changes"}
```

响应：
```json
{
  "type": "response",
  "command": "compact",
  "success": true,
  "data": {
    "summary": "Summary of conversation...",
    "firstKeptEntryId": "abc123",
    "tokensBefore": 150000,
    "estimatedTokensAfter": 32000,
    "usage": {
      "input": 32000,
      "output": 1200,
      "cacheRead": 0,
      "cacheWrite": 0,
      "totalTokens": 33200,
      "cost": {"input": 0.01, "output": 0.02, "cacheRead": 0, "cacheWrite": 0, "total": 0.03}
    },
    "details": {}
  }
}
```

`estimatedTokensAfter` 是在压缩之后立即对重建的消息上下文作出的启发式估算，不是 provider 精确的 token 计数。`usage` 报告生成摘要的那次或那些 LLM 调用，自定义压缩处理器可能省略它。

### set_auto_compaction

启用或禁用上下文接近满时的自动压缩。

```json
{"type": "set_auto_compaction", "enabled": true}
```

响应：
```json
{"type": "response", "command": "set_auto_compaction", "success": true}
```

## 重试

### set_auto_retry

启用或禁用对瞬时错误（过载、速率限制、5xx）的自动重试。

```json
{"type": "set_auto_retry", "enabled": true}
```

响应：
```json
{"type": "response", "command": "set_auto_retry", "success": true}
```

### abort_retry

中止正在进行的重试（取消延迟并停止重试）。

```json
{"type": "abort_retry"}
```

响应：
```json
{"type": "response", "command": "abort_retry", "success": true}
```

## Bash

### bash

执行 shell 命令并把输出加入会话上下文。命令运行期间，输出以 `bash_execution_update` 事件流式输出；响应包含最终结果。

```json
{"id": "req-1", "type": "bash", "command": "ls -la"}
```

如果命令输出应存于会话、但在下一次提示的模型上下文中省略，请把 `excludeFromContext` 设为 `true`。

带上 `id`，以便把流式输出的 `bash_execution_update` 事件与这条命令关联。

响应：
```json
{
  "id": "req-1",
  "type": "response",
  "command": "bash",
  "success": true,
  "data": {
    "output": "total 48\ndrwxr-xr-x ...",
    "exitCode": 0,
    "cancelled": false,
    "truncated": false
  }
}
```

如果输出被截断，会包含 `fullOutputPath`：
```json
{
  "type": "response",
  "command": "bash",
  "success": true,
  "data": {
    "output": "truncated output...",
    "exitCode": 0,
    "cancelled": false,
    "truncated": true,
    "fullOutputPath": "/tmp/pi-bash-abc123.log"
  }
}
```

**bash 结果如何到达 LLM：**

`bash` 命令立即执行并返回一个 `BashResult`。在内部，会创建一条 `BashExecutionMessage` 并存入 agent 的消息状态。

当下一条 `prompt` 命令发送时，Pi 会在把上下文消息发给模型之前转换它们。除非 `excludeFromContext` 为 true，`BashExecutionMessage` 会变成如下格式的 `UserMessage`：

````
Ran `ls -la`
```
total 48
drwxr-xr-x ...
```
````

这意味着：
1. 被包含的 bash 输出在**下一次提示**时才到达模型，而不是立即到达。
2. 一次提示之前可以运行多条 bash 命令；Pi 会包含每一份未设置 `excludeFromContext` 的输出。

### abort_bash

中止正在运行的 bash 命令。

```json
{"type": "abort_bash"}
```

响应：
```json
{"type": "response", "command": "abort_bash", "success": true}
```

## 会话

### get_session_stats

获取 token 用量、成本统计以及当前上下文窗口占用。

```json
{"type": "get_session_stats"}
```

响应：
```json
{
  "type": "response",
  "command": "get_session_stats",
  "success": true,
  "data": {
    "sessionFile": "/path/to/session.jsonl",
    "sessionId": "abc123",
    "userMessages": 5,
    "assistantMessages": 5,
    "toolCalls": 12,
    "toolResults": 12,
    "totalMessages": 22,
    "tokens": {
      "input": 50000,
      "output": 10000,
      "cacheRead": 40000,
      "cacheWrite": 5000,
      "total": 105000
    },
    "cost": 0.45,
    "contextUsage": {
      "tokens": 60000,
      "contextWindow": 200000,
      "percent": 30
    }
  }
}
```

`tokens` 和 `cost` 覆盖整个会话，包括 assistant 消息、工具上报的用量以及压缩/分支摘要的生成。`contextUsage` 包含用于压缩和页脚显示的实际当前上下文窗口估算。

当没有可用模型或上下文窗口时，`contextUsage` 会被省略。压缩刚完成时，`contextUsage.tokens` 和 `contextUsage.percent` 为 `null`，直到压缩后出现新的 assistant 响应提供有效用量数据。

### export_html

把会话导出为 HTML 文件。

```json
{"type": "export_html"}
```

带自定义路径时：
```json
{"type": "export_html", "outputPath": "/tmp/session.html"}
```

响应：
```json
{
  "type": "response",
  "command": "export_html",
  "success": true,
  "data": {"path": "/tmp/session.html"}
}
```

### switch_session

加载另一个会话文件。可被 `session_before_switch` 扩展事件处理器取消。

```json
{"type": "switch_session", "sessionPath": "/path/to/session.jsonl"}
```

响应：
```json
{"type": "response", "command": "switch_session", "success": true, "data": {"cancelled": false}}
```

如果扩展取消了切换：
```json
{"type": "response", "command": "switch_session", "success": true, "data": {"cancelled": true}}
```

### fork

基于活动分支上某条先前的用户消息创建一个新的 fork。可被 `session_before_fork` 扩展事件处理器取消。返回作为 fork 起点的消息文本。

```json
{"type": "fork", "entryId": "abc123"}
```

响应：
```json
{
  "type": "response",
  "command": "fork",
  "success": true,
  "data": {"text": "The original prompt text...", "cancelled": false}
}
```

如果扩展取消了 fork：
```json
{
  "type": "response",
  "command": "fork",
  "success": true,
  "data": {"cancelled": true}
}
```

### clone

把当前活动分支在当前位置上复制到一个新会话中。可被 `session_before_fork` 扩展事件处理器取消。

```json
{"type": "clone"}
```

响应：
```json
{
  "type": "response",
  "command": "clone",
  "success": true,
  "data": {"cancelled": false}
}
```

如果扩展取消了克隆：
```json
{
  "type": "response",
  "command": "clone",
  "success": true,
  "data": {"cancelled": true}
}
```

### get_fork_messages

获取可用于 fork 的用户消息。

```json
{"type": "get_fork_messages"}
```

响应：
```json
{
  "type": "response",
  "command": "get_fork_messages",
  "success": true,
  "data": {
    "messages": [
      {"entryId": "abc123", "text": "First prompt..."},
      {"entryId": "def456", "text": "Second prompt..."}
    ]
  }
}
```

### get_entries

按追加顺序获取所有会话条目（不含会话文件头）。会话是一棵只追加的条目树，条目 id 稳定，因此条目 id 可作为持久的游标：把你见过的最后一个条目 id 作为 `since` 传入，即可只获取它严格之后的条目，即使客户端重启也有效。与 `get_messages` 不同，这里包含压缩前的历史和已放弃的分支。

```json
{"type": "get_entries"}
```

带游标时：
```json
{"type": "get_entries", "since": "abc123"}
```

响应：
```json
{
  "type": "response",
  "command": "get_entries",
  "success": true,
  "data": {
    "entries": [
      {"type": "message", "id": "def456", "parentId": "abc123", "timestamp": "...", "message": {"role": "user", "...": "..."}}
    ],
    "leafId": "def456"
  }
}
```

`leafId` 是当前叶子条目的 id（空会话为 `null`），因此客户端一次往返就能判断活动分支是否移动过。如果 `since` 不匹配任何条目 id，响应为 `success: false`。

### get_tree

以条目树的形式获取会话。每个节点是 `{entry, children, label?, labelTimestamp?}`。结果是数组，因为导航 API 可能创建多个根；父链断裂的孤立条目也会作为根出现。

```json
{"type": "get_tree"}
```

响应：
```json
{
  "type": "response",
  "command": "get_tree",
  "success": true,
  "data": {
    "tree": [
      {
        "entry": {"type": "message", "id": "abc123", "parentId": null, "...": "..."},
        "children": [
          {"entry": {"type": "message", "id": "def456", "parentId": "abc123", "...": "..."}, "children": []}
        ]
      }
    ],
    "leafId": "def456"
  }
}
```

### get_last_assistant_text

获取最后一条 assistant 消息的文本内容。来自被中止或失败轮次的无文本消息，以及只调用工具的消息会被跳过。

```json
{"type": "get_last_assistant_text"}
```

响应：
```json
{
  "type": "response",
  "command": "get_last_assistant_text",
  "success": true,
  "data": {"text": "The assistant's response..."}
}
```

如果不存在 assistant 文本，`text` 值为 `null`。

### set_session_name

为当前会话设置显示名称。该名称会出现在会话列表中，便于识别会话。

```json
{"type": "set_session_name", "name": "my-feature-work"}
```

响应：
```json
{
  "type": "response",
  "command": "set_session_name",
  "success": true
}
```

当前会话名称可通过 `get_state` 的 `sessionName` 字段获取。要在启动 RPC 模式时设置初始名称，请向 `pi --mode rpc` 进程传入 `--name <name>` 或 `-n <name>`。

## 可发现的命令

### get_commands

获取可用命令（扩展命令、提示模板和技能）。在名称前加上 `/`，即可通过 `prompt` 命令运行其中一条。

```json
{"type": "get_commands"}
```

响应：
```json
{
  "type": "response",
  "command": "get_commands",
  "success": true,
  "data": {
    "commands": [
      {
        "name": "fix-tests",
        "description": "Fix failing tests",
        "source": "prompt",
        "sourceInfo": {
          "path": "/home/user/myproject/.pi/agent/prompts/fix-tests.md",
          "source": "local",
          "scope": "project",
          "origin": "top-level"
        }
      }
    ]
  }
}
```

每条命令包含：
- `name`：命令名（使用时写 `/name`）
- `description`：便于人阅读的描述（扩展命令可选）
- `source`：命令的种类：
  - `"extension"`：在扩展中通过 `pi.registerCommand()` 注册
  - `"prompt"`：从提示模板 `.md` 文件加载
  - `"skill"`：从技能目录加载（名称带 `skill:` 前缀）
- `sourceInfo`：注册该命令的资源的元数据：
  - `path`：资源的绝对路径
  - `source`：Pi 发现它的方式，例如 `"local"`、`"auto"` 或 `"cli"`
  - `scope`：`"user"`、`"project"` 或 `"temporary"`
  - `origin`：直接加载的资源为 `"top-level"`，来自包的资源为 `"package"`
  - `baseDir`：包的基础目录，适用时提供

**注意**：内置 TUI 命令（`/settings`、`/hotkeys` 等）不包含在内。它们只在交互模式中处理，通过 `prompt` 发送不会执行。

<a id="model-object"></a>

## 模型对象

模型相关命令返回完整的已配置模型定义。成本以美元/百万 token 计。

```json
{
  "id": "claude-sonnet-4-20250514",
  "name": "Claude Sonnet 4",
  "api": "anthropic-messages",
  "provider": "anthropic",
  "baseUrl": "https://api.anthropic.com",
  "reasoning": true,
  "input": ["text", "image"],
  "contextWindow": 200000,
  "maxTokens": 16384,
  "cost": {
    "input": 3.0,
    "output": 15.0,
    "cacheRead": 0.3,
    "cacheWrite": 3.75
  }
}
```

模型配置见[配置兼容端点](models.md#configure-a-compatible-endpoint)。在 TypeScript 中，请使用 `@earendil-works/pi-ai` 导出的 `Model` 类型。
