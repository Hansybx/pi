> 这是简体中文译本，译自 `packages/coding-agent/docs/custom-provider.md`。与英文原文如有出入，以原文为准。

# 自定义 provider

provider 扩展把 Pi 连接到需要自定义认证、模型发现、请求处理或流式输出的模型服务。如果该服务已经使用受支持的 API，改为在 `models.json` 中配置它。

provider 扩展在 Pi 内部运行，可以查看凭证、提示词、工具定义、模型响应和用量。请把它们视为可信代码，并避免记录密钥或 provider 负载。

## 选择最小的集成方式

| 需求 | 使用 |
|---|---|
| 在受支持的 API 后面添加模型 | [`models.json`](models.md#configure-a-compatible-endpoint) |
| 修改现有 provider 的端点或请求头 | `models.json` 或一个小型 provider 扩展 |
| 动态发现模型 | 带 `refreshModels` 的 provider |
| 添加 `/login` 流程 | 配置了原生或旧式 OAuth 的 provider |
| 实现不受支持的线协议 | 带 `stream` 或 `streamSimple` 的 provider |

provider 扩展本身就是一种[扩展](../../../packages/coding-agent/docs/extensions.md)，因此遵循相同的加载、信任、重载和错误处理行为。

## 注册 provider

在扩展工厂函数中调用 `pi.registerProvider()`。Pi 在继续启动之前会等待异步工厂，因此在其中注册的 provider 可用于启动时的模型选择和 `pi --list-models`。

有两种注册形式：

- 注册来自 `@earendil-works/pi-ai` 的完整 `Provider`，以获得原生认证、过滤、发现、刷新和流式行为。
- 用 `ProviderConfig` 注册 provider 名称，即现有扩展使用的旧式配置形式。

对于超出静态端点和模型元数据的新集成，优先使用完整 provider。Pi 会把 `models.json` 中的覆盖配置叠加在已注册的原生 provider 之上。

对现有 provider 只注册 `baseUrl` 或 `headers` 会保留其内置模型。在旧式形式中提供 `models` 会替换该 provider 在聊天、图像和分类器操作中的模型。省略 `type` 意味着 `"chat"`；图像模型和分类器模型需要显式的判别字段，以及通过 `images` 和 `classifiers` 字段按其 `api` 值索引的实现。

### 重定向现有 provider

只注册需要改变的字段。这会保留该 provider 的内置目录、认证、API 实现和兼容性设置：

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerProvider("anthropic", {
    baseUrl: "https://gateway.example.com/anthropic",
    headers: {
      "X-Gateway-Key": "$GATEWAY_API_KEY",
    },
  });
}
```

对保留上游协议的代理或网关使用这种形式。不要把内置模型列表复制到扩展里，因为这样做会把小幅的端点覆盖变成可能逐渐走样的目录替换。

### 注册兼容端点

当某个服务实现了受支持的协议但有自己的模型目录时，注册该端点以及该服务实际只暴露的那些模型：

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerProvider("acme", {
    name: "Acme AI",
    baseUrl: "https://api.acme.example/v1",
    apiKey: "$ACME_API_KEY",
    api: "openai-completions",
    models: [
      {
        type: "chat",
        id: "acme-chat",
        name: "Acme Chat",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      },
    ],
  });
}
```

如果不需要可执行的扩展行为，这种情况优先用 `models.json`。当注册依赖运行时发现、自定义认证或与其他扩展功能共享的代码时，才使用扩展。

### 注册混合操作的模型

混合操作的 provider 可以把非 chat 模型及其实现一起注册：

```typescript
pi.registerProvider("media-tools", {
  apiKey: "$MEDIA_TOOLS_API_KEY",
  models: [
    {
      type: "image",
      id: "image-v1",
      name: "Image V1",
      api: "media-images",
      baseUrl: "https://media.example.com/v1",
      input: ["text"],
      output: ["image"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    },
    {
      type: "classifier",
      id: "classifier-v1",
      name: "Classifier V1",
      api: "media-classifier",
      baseUrl: "https://media.example.com/v1",
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 64000,
    },
  ],
  images: {
    "media-images": { generateImages: async (model, context, options) => result },
  },
  classifiers: {
    "media-classifier": { classify: async (model, context, options) => result },
  },
});
```

模型级的 `baseUrl` 值优先于 provider 端点。如果没有提供 `models` 列表，每种操作的内置模型都会保持注册。不同操作中相同的模型 ID 仍然彼此独立，包括它们的模型专属请求头。

初始扩展加载之后进行的调用会立即生效。使用 `pi.unregisterProvider()` 移除动态 provider，并恢复它替换掉的内置行为。

完整的注册示例见已检入的 [GitLab Duo provider](../../../packages/coding-agent/examples/extensions/custom-provider-gitlab-duo/)，它把流式输出委托给内置 API 实现。

## 提供认证

静态 provider 可以从字面量、环境变量插值或命令解析 API key。这些值使用与 `models.json` 相同的语法：

- `$NAME` 和 `${NAME}` 读取环境变量。
- 前导的 `!command` 使用命令输出。
- `$$` 输出字面量 `$`。
- `$!` 输出字面量的前导 `!`。

当集成需要存储的凭证、自定义解析、provider 作用域的环境变量或多重登录方式时，请使用原生 provider 认证。

OAuth provider 提供显示名称、登录流程、token 刷新和 access token 解析。注册后它会出现在 `/login` 中，Pi 会把返回的凭证保存到 `~/.pi/agent/auth.json`。

OAuth 回调与 UI 无关。它们可以打开授权 URL、显示设备码、报告进度、请求输入，或让用户选择登录方式。在网络请求期间要正确处理取消和提供的 abort 信号。

按 Enter（`tui.select.confirm`）打开设备登录 URL 并复制验证码，或手动登录。provider 可以在 `onDeviceCode` 或原生 `AuthEvent` 通知中用 `openBrowserOnConfirm: false` 或 `copyCodeOnConfirm: false` 禁用其中任一操作。

绝不要把 access token、refresh token、authorization 头或完整的 provider 响应写入普通日志。

## 提供和刷新模型

每个模型都需要 ID、显示名称、输入能力和成本元数据。chat 模型和分类器模型还需要上下文窗口；chat 模型需要输出上限和推理支持；图像模型则声明其输出模态。除非某个模型需要覆盖，否则在 provider 级别选择 API 实现。

当希望 Pi 保持空闲的提示缓存预热时，把 `promptCache.short` 或 `promptCache.long` 设为该 provider 尽力而为的缓存存活时间（秒）。不设置它们即可为该保留层级禁用缓存预热。

兼容性标志描述在其他方面受支持的 API 中经过验证的差异。不要仅凭某个端点声称兼容就启用它们。

对照实际的服务器确认请求字段和响应行为。

当可用目录来自实时服务时使用 `refreshModels`。把 `context.signal` 传入阻塞式 I/O，以便调用方可以取消刷新。

两种注册形式有不同的刷新约定：

- 完整的 `Provider` 不返回任何内容。它调用 `context.publish({ update })` 安装 provider 自有的模型状态，随后其同步的 `getModels()` 会暴露最新的列表。
- 旧式的 `ProviderConfig.refreshModels` 返回混合操作的模型定义。Pi 用返回的列表替换该注册的实时模型，并应用任何所请求的持久化。

只有在持久化的目录数据需要跨多次运行保留时才发布它。像 llama.cpp 这样的实时服务可以只更新内存中的列表而不持久化；远程目录则可以保留快照以便离线启动。

## 复用受支持的流式 API

只要 provider 协议与 Pi AI 的某个 API 实现匹配，就使用它。

受支持的实现涵盖 Anthropic Messages、OpenAI Chat Completions 和 Responses、Google Generative AI 和 Vertex、Azure OpenAI Responses、Mistral Conversations 以及 Bedrock Converse。

provider 仍然可以自定义认证、base URL、请求头、模型过滤和发现，同时把请求转换和流式输出委托给现有的 API 实现。

这比复制一份流式实现更安全，因为它保留了 Pi 的消息转换、工具处理、用量统计、取消和兼容性行为。

## 实现自定义流式输出

只有在没有任何现有 API 实现能表示该服务时才实现 `streamSimple`。请先研究 [`packages/ai/src/api`](https://github.com/earendil-works/pi/tree/main/packages/ai/src/api) 下的实现。

流会收到规范化的 `TranscriptContext`。系统提示词和工具声明位于对话记录的系统消息中，因此要用 `getCurrentSystemPrompt(context.messages)` 和 `getCurrentTools(context.messages)` 读取它们，而不要期望 `context.systemPrompt` 或 `context.tools`。支持会话中途系统消息的模型可以就地收到这些消息；否则调用 `collapseSystemMessages(context)` 把后续系统消息折叠进开头的那一条。

自定义流必须：

1. 创建一条 assistant 消息，包含 provider、模型、时间戳、待定的停止原因、内容和置零的用量。
2. 在请求准备成功之后，先于内容事件发出一个 `start` 事件。
3. 在发出配对的文本、思考和工具调用事件时更新该消息。
4. 最终确定用量、成本、内容和停止原因。
5. 准确发出一个终止性的 `done` 或 `error` 事件，并关闭流。
6. 把取消转换为 aborted 结果。

请求准备可能在 `start` 之前失败；此时流可以直接以 `error` 终止。缺少请求认证时也可能在返回流之前同步抛出异常。

内容索引指的是 assistant 消息中的块。在发出其 `partial` 字段暴露该状态的事件之前，先更新对应的块。工具调用参数必须在 `toolcall_end` 之前包含有效的已解析输入。

流还必须遵循通过 `SimpleStreamOptions` 提供的请求埋点：

- 在发送 provider 请求之前调用 `options.onPayload`，并使用它返回的替换负载（若有）。
- 在收到响应之后、消费响应体之前调用 `options.onResponse`。
- 对每个解析出的 provider 事件，在规范化它之前等待 `options.onProviderStreamEvent?.(providerEvent, model)`。
- 透传 abort 信号和 provider 作用域的环境变量。

这些钩子支撑扩展的请求检查、响应头事件和 provider 流观察。省略它们会使该 provider 的行为与 Pi 的内置 provider 不同。

## 报告失败与用量

设置具体的终止停止原因。错误和 aborted 消息需要 `errorMessage`；成功的消息需要准确的输入、输出、缓存、总 token 和成本值。

Pi 在识别出上下文溢出错误后可以压缩并重试。如果该服务使用未知的消息，只在带守卫的 `message_end` 处理器中把该 provider 的溢出响应规范化为 `context_length_exceeded`。

不要把速率限制或 provider 的暂时性故障改写为上下文溢出。这些故障应使用 Pi 的常规重试行为。

## 测试集成

至少测试以下内容：

- 普通文本响应和空文本响应
- 工具调用和工具结果
- 支持时的图像输入和图像工具结果
- 用量和成本统计
- 中止行为
- 上下文溢出
- 格式错误或不完整的流
- Unicode 边界
- 跨 provider 的会话移交
- 认证刷新和取消

[`packages/ai/test`](https://github.com/earendil-works/pi/tree/main/packages/ai/test) 下的 provider 测试定义了内置 provider 的预期行为。请改编相关的测试套件，而不要只依赖手动提示。

开发时直接运行该扩展，然后把它移到可被发现的位置，或通过 [Pi 包](packages.md) 分发。在活动会话中修改已发现的 provider 扩展后，使用 `/reload`。
