> 这是简体中文译本，译自 `packages/coding-agent/docs/rpc.md`。与英文原文如有出入，以原文为准。

# RPC 模式

RPC 模式把 Pi 作为长期运行的子进程运行，通过 stdin 和 stdout 上的 JSON 记录进行控制。它适用于与语言无关的集成、进程隔离、IDE 以及自定义用户界面。

对于进程内的 Node.js 或 Bun 集成，优先使用 [SDK](sdk.md)。对于基于子进程的 TypeScript 集成，优先使用导出的 `RpcClient`，它会启动 Pi、关联响应、暴露带类型的命令方法，并把事件投递给监听器。

| 接口 | 进程边界 | 控制模型 | 最适合 |
|---|---|---|---|
| [SDK](sdk.md) | 进程内 | 直接的 TypeScript 方法与事件 | 需要完整 API 访问的 Node.js 或 Bun 宿主 |
| RPC | 子进程 | JSONL 命令、响应和事件 | 其他语言、隔离进程、IDE 或自定义客户端 |

## 启动 RPC 模式

```bash
pi --mode rpc --no-session
```

常规 CLI 选项仍然用来选择工作目录、模型、工具、资源和会话行为。常用选项包括 `--provider`、`--model`、`--name`、`--no-session` 和 `--session-dir`。完整且与版本相关的接口见[命令行](cli.md)；对已安装的版本而言，`pi --help` 才是权威依据。

RPC 模式拒绝 `@file` 形式的提示参数，请改用 [`prompt`](rpc-commands.md#prompt) 命令发送提示。

## 协议记录

协议包含四类记录：

| 方向 | 记录 | 用途 |
|---|---|---|
| stdin | 命令 | 要求 Pi 发送提示、查看状态、修改配置或管理会话 |
| stdout | `response` | 报告单条命令是否成功，并返回命令数据 |
| stdout | 会话事件 | 流式输出运行、消息、工具、队列、压缩和重试活动 |
| 双向 | 扩展 UI 记录 | 在 Pi 与客户端之间转发受支持的扩展交互 |

规范的记录定义见 [RPC 命令](rpc-commands.md)、[JSON 事件流](json.md) 和 [RPC 扩展 UI](rpc-extension-ui.md)。

### 关联命令与响应

每条命令都接受一个可选的字符串 `id`。匹配的响应会重复它：

```json
{"id":"req-1","type":"get_state"}
{"id":"req-1","type":"response","command":"get_state","success":true,"data":{"...":"..."}}
```

当同时可能有不止一条命令未完成时，请使用唯一的 ID。命令处理是异步的，因此客户端应按 ID 关联，而不是按响应顺序。

会话事件通常没有命令 ID，因为它们描述的是会话活动。`bash_execution_update` 是例外：当发起它的 [`bash`](rpc-commands.md#bash) 命令带有 ID 时，它的输出事件会重复该 ID。

`extension_ui_response` 使用由它的 `extension_ui_request` 提供的 ID。它不会产生常规的命令响应。

## 分帧

RPC 使用严格的 JSONL 分帧。每条记录写一个完整的 JSON 对象，并以 LF（`\n`）结束。把 stdout 当作字节流或 UTF-8 流读取，并且只在 LF 处切分记录。剥掉可选的前置回车符，以接受 CRLF 输入。

不要使用把 Unicode 行分隔符或段落分隔符当作记录边界的通用行读取器。特别是 Node.js 的 `readline` 还会在 `U+2028` 和 `U+2029` 处切分，而这两个字符在 JSON 字符串内部是合法的。

持续读取 stdout。Pi 会遵循 stdout 背压，但停止读取的客户端会阻塞该进程。写入命令时请遵循 stdin 背压。stdout 专用于协议记录；诊断信息和应用日志写入 stderr。

## 运行生命周期

`prompt` 响应成功只表示提示已被接受、排队或处理，并不表示模型工作已完成：

```json
{"id":"req-2","type":"prompt","message":"Review this repository"}
{"id":"req-2","type":"response","command":"prompt","success":true,"data":{"disposition":"started"}}
```

`data.disposition` 报告提示的处理结果。如果它是 `"handled"`，说明此提示没有启动运行，因此不要等待 `agent_settled`。所有取值见 [RPC 命令](rpc-commands.md#prompt)。

在该响应之后继续消费[事件](json.md)。`agent_end` 标记一次底层 agent 运行的结束，但重试、溢出恢复、压缩、引导或后续工作仍可能接续。当客户端需要知道 Pi 不会自动继续时，请等待 `agent_settled`。

在发送提示前先订阅，以免错过很快的完成事件。`RpcClient.promptAndWait()` 内部就会这样做。如果使用分开的 `RpcClient` 调用，请在 `prompt()` 之前安装事件监听器，并且只在有运行活动期间调用 `waitForIdle()`。

## 错误

命令失败时返回一个 `success: false` 的响应：

```json
{"id":"req-3","type":"response","command":"set_model","success":false,"error":"Model not found: invalid/model"}
```

JSON 格式错误会产生一个不带请求 ID 的解析响应：

```json
{"type":"response","command":"parse","success":false,"error":"Failed to parse command: Unexpected token..."}
```

成功响应只覆盖命令处理。提示被接受之后发生的 provider 失败和中止会出现在消息流和事件流中。

客户端还必须处理子进程启动失败、意外退出、stderr 诊断信息、取消以及自身的超时。不要把 stderr 解析为协议数据。

## 关闭

关闭子进程的 stdin 以请求有序关闭。Pi 会释放活动运行时，并等待未完成的工作结束后才退出，因此在杀掉它之前请给它留出退出时间。客户端仍应处理进程信号和意外退出。

SIGTERM 和 SIGHUP 也会启动有序关闭。一旦关闭已经开始（无论源于 stdin EOF 还是信号），stdin EOF 或单个信号都不会中断它；第二个信号会立即退出。同时关闭 stdin 并发送 SIGTERM 是安全的。

扩展也可以通过 `ctx.shutdown()` 请求关闭。如果会话空闲且没有正在处理的命令，Pi 会立即关闭。否则它会等到当前命令结束（对 `prompt` 而言，等提示落定）或活动运行发出 `agent_settled` 之后再关闭。（在扩展启动的压缩正在运行时发出的请求，会等待下一条命令或下一次运行结束。）

## 最小客户端

下面这个 Python 示例使用二进制管道读取器，它只在 LF 处切分，不会把 Unicode 分隔符当作协议边界：

```python
import json
import subprocess

process = subprocess.Popen(
    ["pi", "--mode", "rpc", "--no-session"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
)

assert process.stdin is not None
assert process.stdout is not None

command = {"id": "prompt-1", "type": "prompt", "message": "Hello"}
process.stdin.write(json.dumps(command).encode("utf-8") + b"\n")
process.stdin.flush()

while line := process.stdout.readline():
    record = json.loads(line)
    if record.get("type") == "message_update":
        update = record["assistantMessageEvent"]
        if update["type"] == "text_delta":
            print(update["delta"], end="", flush=True)
    elif record.get("type") == "agent_settled":
        print()
        break

process.stdin.close()
process.wait()
```

对于持续维护的 TypeScript 客户端，请使用已纳入版本库的 [RPC 客户端示例](../../../packages/coding-agent/examples/rpc-client.ts)。它要求先构建 Pi CLI，因为仓库中的示例指向 `dist/cli.js`。

## 参考

- [RPC 命令](rpc-commands.md)：每条 stdin 命令与响应
- [JSON 事件流](json.md)：共用的 stdout 会话事件与流式输出重建
- [RPC 扩展 UI](rpc-extension-ui.md)：对话框、通知、响应与限制
- [消息类型](message-types.md)：响应和事件使用的消息与内容块
- [会话文件格式](session-format.md)：会话命令返回的条目
- [`rpc-types.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/rpc/rpc-types.ts)：导出的 TypeScript 协议定义
- [`RpcClient`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/rpc/rpc-client.ts)：子进程客户端实现

## 迁移后的参考锚点

原先位于本页的详细参考现在有了独立页面。以下锚点用于保留现有链接。

<a id="prompt"></a>
<a id="steer"></a>
<a id="follow_up"></a>
<a id="abort"></a>
<a id="clear_queue"></a>
<a id="new_session"></a>
<a id="get_state"></a>
<a id="get_messages"></a>
<a id="set_model"></a>
<a id="cycle_model"></a>
<a id="get_available_models"></a>
<a id="set_thinking_level"></a>
<a id="cycle_thinking_level"></a>
<a id="get_available_thinking_levels"></a>
<a id="set_steering_mode"></a>
<a id="set_follow_up_mode"></a>
<a id="compact"></a>
<a id="set_auto_compaction"></a>
<a id="set_auto_retry"></a>
<a id="abort_retry"></a>
<a id="bash"></a>
<a id="abort_bash"></a>
<a id="get_session_stats"></a>
<a id="export_html"></a>
<a id="switch_session"></a>
<a id="fork"></a>
<a id="clone"></a>
<a id="get_fork_messages"></a>
<a id="get_entries"></a>
<a id="get_tree"></a>
<a id="get_last_assistant_text"></a>
<a id="set_session_name"></a>
<a id="get_commands"></a>

命令详情已迁移到 [RPC 命令](rpc-commands.md)。

<a id="message_update-streaming"></a>
<a id="bash_execution_update"></a>
<a id="compaction_start--compaction_end"></a>
<a id="summarization_retry_scheduled--summarization_retry_attempt_start--summarization_retry_finished"></a>

事件详情已迁移到 [JSON 事件流](json.md)。

<a id="extension-ui-protocol"></a>

扩展交互详情已迁移到 [RPC 扩展 UI](rpc-extension-ui.md)。
