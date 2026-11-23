> 这是简体中文译本，译自 `packages/coding-agent/docs/sdk.md`。与英文原文如有出入，以原文为准。

# SDK

`@earendil-works/pi-coding-agent` 把 Pi 嵌入 Node.js 或 Bun 进程。它让你用 TypeScript 直接访问命令行应用所用的 agent、会话、工具、模型和资源。

需要进程内 TypeScript 集成时使用 SDK。如果需要与语言无关的隔离子进程，见 [CLI 集成](cli-integration.md)。

```typescript
import { createAgentSession } from "@earendil-works/pi-coding-agent";

const { session } = await createAgentSession();

try {
  await session.prompt("What files are in the current directory?");
  console.log(session.getLastAssistantText());
} finally {
  session.dispose();
}
```

这段代码使用工作目录、发现的资源、已存储的设置和已配置的凭证。运行结束时 `prompt()` 完成（resolve）。

[完整的极简示例](../../../packages/coding-agent/examples/sdk/01-minimal.ts)还会流式输出文本事件。所有 [SDK 示例](../../../packages/coding-agent/examples/sdk/)都随仓库一起做类型检查。

<a id="session-management"></a>

## 会话生命周期

`createAgentSession()` 创建一个 `AgentSession`。该会话拥有一次对话、其模型与工具、排队的消息、压缩（compaction）状态以及扩展运行时。

通过 `session.messages`、`session.model`、`session.thinkingLevel`、`session.systemPrompt` 和 `session.getActiveToolNames()` 读取当前状态。

`session.systemPrompt` 是只读的，返回当前生效的系统提示词，包括尚未发送给模型的变更。工具变更会在下一次请求之前声明给模型。

<a id="sessionmanager-api"></a>

### 会话存储

会话默认持久化。`SessionManager` 拥有持久化或内存中的条目树，并跟踪其活动叶子。分支会改变该叶子，而不删除被放弃的分支。Pi 重建模型上下文时，管理器选择活动分支并应用压缩（compaction）。

对最终确定的模型上下文而言，`SessionManager` 是权威来源。要恢复外部历史，请用包含那些条目的管理器构造会话。给 `session.agent.state.messages` 赋值不会替换持久化的上下文。

当宿主不需要会话文件时，使用内存中的管理器：

```typescript
import { createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
});
```

创建、打开、继续、列出和 fork 会话的示例见已校验的 [sessions 示例](../../../packages/coding-agent/examples/sdk/11-sessions.ts)。[会话文件格式](session-format.md)定义了持久化的 JSONL 约定，[消息类型](message-types.md)定义了对话记录的值。精确的方法和签名请使用导出的 TypeScript 声明或 [`session-manager.ts`](../../../packages/coding-agent/src/core/session-manager.ts)。

`cwd` 选择用于项目资源发现、上下文文件、会话分组和内置工具路径的工作区。当目标与 `process.cwd()` 不同时显式传入它。

`session.dispose()` 中止进行中的工作、使扩展上下文失效、断开与 agent 的连接并移除事件监听器。不再需要该会话时调用它。

`AgentSessionRuntime` 增加了 `newSession()`、`switchSession()`、`fork()` 和 `importFromJsonl()`。每个操作都会替换活动的 `AgentSession`，并为目标工作目录重建服务。

运行时替换之后，订阅属于旧的 `AgentSession`，必须重新绑定。见[会话运行时示例](../../../packages/coding-agent/examples/sdk/13-session-runtime.ts)。

## 提示

`prompt()` 会处理扩展命令，并在普通用户消息进入 agent 之前展开基于文件的提示模板。对于被接受的 agent 运行，它在运行结束后完成（resolve），包括自动重试。

会话已在流式输出时发送的提示必须指明它应当引导当前运行还是跟随其后。不带该选择的 `prompt()` 调用会直接拒绝，而不是猜测。

引导消息在当前助手轮次及其工具调用之后进入。后续消息在当前运行完成其待处理工作之后进入。`steer()` 和 `followUp()` 直接暴露这些行为，如果输入被排队（包括扩展转换之后），返回 `"queued"`；如果扩展消费了它，返回 `"handled"`。

`abort()` 停止活动操作并等待会话进入空闲。`waitForIdle()` 等待而不中止它。

## 订阅事件

宿主需要流式输出时，在提示之前订阅：

```typescript
const unsubscribe = session.subscribe((event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

try {
  await session.prompt("Explain this repository");
} finally {
  unsubscribe();
}
```

会话事件报告消息更新、工具执行、队列、压缩（compaction）、重试和运行生命周期变更。

`message_end` 包含权威的已完成消息。`agent_end` 标记一次底层 agent 运行的结束，但自动恢复或排队的工作仍可能随后发生。

宿主需要知道 Pi 不会自动继续时，使用 `agent_settled`。

## 配置会话

在没有覆盖项时，工厂会创建 `ModelRuntime`、基于文件的 `SettingsManager`、持久化的 `SessionManager`、`DefaultResourceLoader` 以及已配置的默认工具。

每个边界都可显式提供：

- `modelRuntime`、`model`、`thinkingLevel` 和 `scopedModels` 控制模型的访问与选择。
- `settingsManager` 提供合并后的设置或内存中的配置。
- `sessionManager` 提供持久化或内存中的对话历史。
- `resourceLoader` 提供扩展、技能、提示模板、主题和上下文文件。
- `tools`、`noTools`、`excludeTools` 和 `customTools` 控制活动工具集。

需要标准发现流程并带部分覆盖项时，使用 `DefaultResourceLoader`。宿主完全掌控资源存储与发现时，提供自定义的 `ResourceLoader`。

<a id="inlineextension"></a>

内联扩展工厂可通过 `DefaultResourceLoader` 提供。仅当内联扩展在诊断和启动输出中需要稳定名称时，才给它一个 `InlineExtension` 名称。带 `replaceable: true` 的具名内联扩展，如果另一个扩展在加载期间注册了与它相同名称的工具、命令或旗标，则会被跳过，而不是两者都加载并产生冲突。CLI 内置的 codemode、tool search 和 MCP 扩展都是可替换的。带 `builtin: true` 的具名条目不是内联扩展：它提供 `builtin:<name>` 扩展的代码，加载方式与已配置的扩展文件相同。它默认加载，在 `pi config` 中列出，可通过 `extensions` 设置中的 `-builtin:<name>` 或 `noExtensions` 禁用；`additionalExtensionPaths: ["builtin:<name>"]` 可显式加载它。它在项目信任解析之后加载，因此无法处理 `project_trust`。CLI 内置的扩展使用它。

<a id="codemode-mcp"></a>

CLI 把 `codemode`、`tool_search` 和 MCP 作为内置扩展加载。SDK 会话不会；请把 `createCodemodeExtension()`、`createToolSearchExtension()` 和 `createMcpExtension()` 加入 `DefaultResourceLoader` 的 `extensionFactories`。`codemode` 和 `tool_search` 以未激活状态注册：通过 `defaultTools` 设置启用它们（`["+codemode", "+tool_search"]` 会保留其他默认工具），或者让 MCP 扩展激活它们：`codemode` 针对以 `codemode` 暴露的服务器，`tool_search` 针对以 `deferred` 暴露的服务器。MCP 扩展在 `session_start` 时连接其服务器，因此要调用 `session.bindExtensions()`。见 [Codemode 和 MCP](../../../packages/coding-agent/examples/sdk/14-codemode-mcp.ts)。

[模型](../../../packages/coding-agent/examples/sdk/02-custom-model.ts)、[工具](../../../packages/coding-agent/examples/sdk/05-tools.ts)、[扩展](../../../packages/coding-agent/examples/sdk/06-extensions.ts)和[完全控制](../../../packages/coding-agent/examples/sdk/12-full-control.ts)有各自的专项示例。

## 示例

| 示例 | 用途 |
|---|---|
| [极简](../../../packages/coding-agent/examples/sdk/01-minimal.ts) | 创建、提示、观察并释放会话 |
| [自定义模型](../../../packages/coding-agent/examples/sdk/02-custom-model.ts) | 选择模型和思考级别 |
| [系统提示词](../../../packages/coding-agent/examples/sdk/03-custom-prompt.ts) | 替换或追加系统提示词 |
| [技能](../../../packages/coding-agent/examples/sdk/04-skills.ts) | 发现、过滤和添加技能 |
| [工具](../../../packages/coding-agent/examples/sdk/05-tools.ts) | 选择内置工具及其工作目录 |
| [扩展](../../../packages/coding-agent/examples/sdk/06-extensions.ts) | 加载基于文件的扩展和内联扩展 |
| [上下文文件](../../../packages/coding-agent/examples/sdk/07-context-files.ts) | 添加或替换项目指令 |
| [提示模板](../../../packages/coding-agent/examples/sdk/08-prompt-templates.ts) | 添加文件式提示模板 |
| [凭证](../../../packages/coding-agent/examples/sdk/09-api-keys-and-oauth.ts) | 配置凭证和模型存储 |
| [设置](../../../packages/coding-agent/examples/sdk/10-settings.ts) | 提供基于文件或内存中的设置 |
| [会话](../../../packages/coding-agent/examples/sdk/11-sessions.ts) | 控制会话的持久化和恢复 |
| [完全控制](../../../packages/coding-agent/examples/sdk/12-full-control.ts) | 替换默认的发现与状态服务 |
| [会话运行时](../../../packages/coding-agent/examples/sdk/13-session-runtime.ts) | 安全地替换活动会话 |
| [Codemode 和 MCP](../../../packages/coding-agent/examples/sdk/14-codemode-mcp.ts) | 添加 `codemode`、`tool_search` 和 MCP 扩展 |

<a id="exports"></a>

## 资源

- [选择模型](models.md)介绍模型选择和兼容端点；[provider](providers.md) 介绍凭证和 provider（提供商）特有的设置。
- [配置](configuration.md)解释常规发现与设置；[设置](settings.md)列出每一项设置。
- [会话与上下文](sessions.md)解释会话行为；[会话格式](session-format.md)定义持久化条目；[消息类型](message-types.md)定义共享的对话记录值。
- [扩展](../../../packages/coding-agent/docs/extensions.md)、[技能](skills.md)和[提示模板](prompt-templates.md)记录通过 `ResourceLoader` 提供的资源。
- [CLI 集成](cli-integration.md)介绍进程内 SDK 集成之外的 print、JSON 和 RPC 备选方案。
