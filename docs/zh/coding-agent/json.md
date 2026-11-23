> 这是简体中文译本，译自 `packages/coding-agent/docs/json.md`。与英文原文如有出入，以原文为准。

# JSON 事件流

JSON 模式为一次调用输出结构化的进度：

```bash
pi --mode json "Review this repository"
```

Pi 先写入一个会话头部，随后写入会话事件，然后在所提供的提示词执行完毕后退出。RPC 模式输出相同的会话事件形状，但没有会话头部，因为它是双向的、长期运行的协议。请参见 [RPC 模式](rpc.md)。

本页是 JSON 模式和 RPC 模式共享事件的权威参考。消息值使用[共享消息类型](message-types.md)。

## 分帧与进程 I/O

该流使用严格的 JSONL 分帧。每条记录是一个以 LF（`\n`）结尾的 JSON 对象。只在 LF 处拆分记录，并去掉可选的前导回车符。Unicode 行分隔符和段落分隔符在 JSON 字符串内部是合法的，不构成记录边界。

Node.js 的 `readline` 不适用于该流，因为它也会识别那些 Unicode 分隔符。请使用按字节或 UTF-8 的流解码器，并在 LF 处拆分。

要持续读取 stdout。停止消费记录的读取方会在管道缓冲区被填满时阻塞 Pi。stdout 专用于 JSONL；诊断信息和应用日志输出到 stderr。

## 会话头部

JSON 模式的第一条记录是当前的[会话头部](session-format.md#sessionheader)：

```json
{"type":"session","version":3,"id":"uuid","timestamp":"2024-12-03T14:00:00.000Z","cwd":"/path"}
```

RPC 模式不输出该记录。请用 [`get_state`](rpc-commands.md#get_state) 获取其当前会话 ID 和文件。

## 事件序列

一次基本运行会产生如下记录：

```json
{"type":"agent_start"}
{"type":"turn_start"}
{"type":"message_start","message":{"role":"user","content":"Review this repository","timestamp":1733234401000}}
{"type":"message_end","message":{"role":"user","content":"Review this repository","timestamp":1733234401000}}
{"type":"message_start","message":{"role":"assistant","content":[],"stopReason":"pending","...":"..."}}
{"type":"message_update","usage":{"...":"..."},"assistantMessageEvent":{"type":"text_delta","contentIndex":0,"delta":"Hello"}}
{"type":"message_end","message":{"role":"assistant","...":"..."}}
{"type":"turn_end","message":{"role":"assistant","...":"..."},"toolResults":[]}
{"type":"agent_end","messages":[{"...":"..."}],"willRetry":false}
{"type":"agent_settled","aborted":false}
```

`agent_end` 关闭一次底层 agent 运行。自动重试、溢出恢复、压缩重试、引导消息或后续消息工作仍可能继续。`agent_settled` 表示 Pi 在该会话级运行上已没有剩余的自动工作。

## Agent 与轮次事件

| 事件 | 字段 | 含义 |
|---|---|---|
| `agent_start` | 无 | 一次底层 agent 运行开始。 |
| `agent_end` | `messages`、`willRetry` | 该底层运行结束。`messages` 包含本次运行产生的消息。 |
| `agent_settled` | `aborted` | Pi 不会通过重试、压缩恢复或排队消息自动继续。当运行因被中止而结束时，`aborted` 为 `true`。 |
| `turn_start` | 无 | 一个 assistant 轮次开始。 |
| `turn_end` | `message`、`toolResults` | 一次 assistant 响应及其产生的工具调用结束。 |

一个轮次是一次 assistant 响应，加上该响应产生的所有工具调用和工具结果。

## 消息事件

| 事件 | 字段 | 含义 |
|---|---|---|
| `message_start` | `message` | 一条消息开始。 |
| `message_update` | `usage`、`assistantMessageEvent` | assistant 消息发出了一次内容块更新。 |
| `message_end` | `message` | 一条消息完成。这是权威的最终消息。 |

### 重建流式消息

线上传输的 `message_update` 记录只包含增量。它们省略了 SDK 事件中的累积 `message` 字段以及每个 `assistantMessageEvent.partial` 快照，从而让流的大小保持线性。

嵌套事件为下列之一：

| 类型 | 除 `type` 之外的字段 | 含义 |
|---|---|---|
| `start` | 无 | provider 流开始；其累积的 `partial` 字段在线上传输时被移除。 |
| `text_start` | `contentIndex` | 一个文本块开始。 |
| `text_delta` | `contentIndex`、`delta` | 向该块追加文本。 |
| `text_end` | `contentIndex`、`content` | 文本块结束，并带有权威内容。 |
| `thinking_start` | `contentIndex` | 一个思考块开始。 |
| `thinking_delta` | `contentIndex`、`delta` | 向该块追加思考文本。 |
| `thinking_end` | `contentIndex`、`content` | 思考块结束，并带有权威内容。 |
| `toolcall_start` | `contentIndex`、`id`、`toolName` | 一个工具调用块开始。 |
| `toolcall_delta` | `contentIndex`、`delta` | 追加序列化后的参数数据。 |
| `toolcall_end` | `contentIndex`、`toolCall` | 工具调用结束，并带有完整的 `ToolCall`。 |
| `done` | `reason`、`message` | provider 流成功完成。 |
| `error` | `reason`、`error` | provider 流以错误或中止消息结束。 |

常规的 agent 循环会把 provider 级别的 `start`、`done` 和 `error` 转换为 `message_start` 和 `message_end` 会话事件，而不是把它们作为 `message_update` 发出。对于构造匹配会话事件的调用方，导出的 `JsonAgentSessionEvent` 变换仍然接受它们。

用 `contentIndex` 标识内容块。为实时显示缓冲 `delta` 字段，但在 `text_end`、`thinking_end` 或 `toolcall_end` 时要改用完整内容替换重建出的数据。`message_end.message` 到达时，用它替换整个部分消息。

顶层的 `usage` 是该 assistant 响应最新的、由 provider 报告的累积用量。当 provider 在流式输出期间不报告用量时，它在完成之前可能一直为零。

```json
{"type":"message_update","usage":{"input":100,"output":1,"cacheRead":0,"cacheWrite":0,"totalTokens":101,"cost":{"input":0,"output":0,"cacheRead":0,"cacheWrite":0,"total":0}},"assistantMessageEvent":{"type":"text_delta","contentIndex":0,"delta":"Hello "}}
```

## 工具执行事件

| 事件 | 字段 | 含义 |
|---|---|---|
| `tool_execution_start` | `toolCallId`、`toolName`、`args` | 工具执行开始。 |
| `tool_execution_update` | `toolCallId`、`toolName`、`args`、`partialResult` | 工具报告了部分结果。 |
| `tool_execution_end` | `toolCallId`、`toolName`、`result`、`isError`、`durationMs` | 工具执行结束。`durationMs` 是该工具 `execute()` 的耗时，用单调时钟测量；工具未运行时该字段缺失。 |

用 `toolCallId` 关联整个生命周期。`partialResult` 是工具提供的最新部分结果。它究竟是替换还是扩展先前的更新，取决于该工具的结果约定。

```json
{"type":"tool_execution_start","toolCallId":"call_abc123","toolName":"bash","args":{"command":"ls -la"}}
{"type":"tool_execution_update","toolCallId":"call_abc123","toolName":"bash","args":{"command":"ls -la"},"partialResult":{"content":[{"type":"text","text":"partial output"}],"details":{}}}
{"type":"tool_execution_end","toolCallId":"call_abc123","toolName":"bash","result":{"content":[{"type":"text","text":"complete output"}],"details":{}},"isError":false}
```

## 队列与状态事件

| 事件 | 字段 | 含义 |
|---|---|---|
| `queue_update` | `steering`、`followUp` | 待处理的引导消息或后续消息队列发生变化。两个字段都包含完整的当前队列。 |
| `entry_appended` | `entry` | 扩展通过 `pi.appendEntry()` 追加了一个自定义会话条目。 |
| `session_info_changed` | `name` | 会话显示名称发生变化。`name` 缺失表示名称已被清除。 |
| `thinking_level_changed` | `level` | 当前生效的思考等级发生变化。 |

`entry` 的值使用一种持久化的[会话条目类型](session-format.md#entry-types)。

## 压缩事件

`compaction_start` 说明压缩为什么开始：

```json
{"type":"compaction_start","reason":"threshold"}
```

`reason` 为 `"manual"`、`"threshold"` 或 `"overflow"`。

`compaction_end` 在压缩成功时包含结果：

```json
{
  "type": "compaction_end",
  "reason": "threshold",
  "result": {
    "summary": "Summary of conversation...",
    "firstKeptEntryId": "abc123",
    "tokensBefore": 150000,
    "estimatedTokensAfter": 32000,
    "usage": {"...": "..."},
    "details": {}
  },
  "aborted": false,
  "willRetry": false
}
```

如果压缩被中止，则缺少 `result`，且 `aborted` 为 true。如果压缩失败，则缺少 `result`，`aborted` 为 false，并由 `errorMessage` 描述失败原因。成功的溢出恢复会在 Pi 重试提示词之前把 `willRetry` 设为 true。

结果语义请参见[压缩与分支摘要](compaction.md)。

## 重试事件

assistant 轮次重试输出：

```json
{"type":"auto_retry_start","attempt":1,"maxAttempts":3,"delayMs":2000,"errorMessage":"529 overloaded"}
{"type":"auto_retry_end","success":true,"attempt":2}
```

最终失败时，`auto_retry_end` 带有 `success: false` 和一个 `finalError` 字符串。

压缩与分支摘要的重试输出：

```json
{"type":"summarization_retry_scheduled","attempt":1,"maxAttempts":3,"delayMs":2000,"errorMessage":"terminated"}
{"type":"summarization_retry_attempt_start","source":"compaction","reason":"threshold"}
{"type":"summarization_retry_finished"}
```

对于分支摘要，`source` 为 `"branchSummary"`，且 `reason` 缺失。压缩重试上的 `reason` 为 `"manual"`、`"threshold"` 或 `"overflow"`。

## 仅 RPC 的事件

直接的 RPC [`bash`](rpc-commands.md#bash) 命令会为每个输出块输出一条 `bash_execution_update`。其可选的 `id` 与命令 ID 匹配。最终的命令响应可能包含被截断的输出，而这些事件会流式输出全部输出：

```json
{"type":"bash_execution_update","id":"req-1","delta":"total 48\n"}
```

当扩展处理器抛出异常时，RPC 还会添加 `extension_error`：

```json
{"type":"extension_error","extensionPath":"/path/to/extension.ts","event":"tool_call","error":"Error message"}
```

扩展 UI 记录是独立的 RPC 子协议，不是 `AgentSessionEvent` 值。请参见 [RPC 扩展 UI](rpc-extension-ui.md)。

## TypeScript 类型

SDK 的 `AgentSessionEvent` 为进程内消费者提供累积的流式快照。JSON 和 RPC 只变换 `message_update`：

```typescript
type WithoutPartial<T> = T extends { partial: unknown } ? Omit<T, "partial"> : T;

type JsonAssistantMessageEvent<T> = T extends { type: "toolcall_start"; partial: unknown }
  ? WithoutPartial<T> & { id: string; toolName: string }
  : WithoutPartial<T>;

type JsonAgentSessionEvent =
  | Exclude<AgentSessionEvent, { type: "message_update" }>
  | {
      type: "message_update";
      usage: Usage;
      assistantMessageEvent: JsonAssistantMessageEvent<AssistantMessageEvent>;
    };
```

请使用 `@earendil-works/pi-coding-agent` 导出的 `JsonAgentSessionEvent` 类型。其实现位于 [`json-event.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/json-event.ts)。

## 示例

打印一次性运行中已完成的消息：

```bash
pi --mode json "List files" 2>/dev/null | jq -c 'select(.type == "message_end")'
```
