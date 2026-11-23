> 这是简体中文译本，译自 `packages/coding-agent/docs/models-configuration.md`。与英文原文如有出入，以原文为准。

# 模型配置

<!-- 本文件由 TypeScript 源码生成。请勿手动编辑；请运行 npm run generate:references。 -->

本参考列出了 `models.json` 的各个字段。示例参见[配置兼容端点](models.md#configure-a-compatible-endpoint)，文件位置参见[配置](configuration.md#agent-directory)。

在 `models.json` 中添加 `"$schema": "https://pi.dev/schemas/models.schema.json"`，即可获得编辑器校验和补全。

## provider

`providers` 下的每个键都是一个 provider ID。使用内置 provider ID 会修改该 provider。其他任何 ID 都会新增一个 provider，它需要在 provider 级或模型级提供 `baseUrl` 和 `api`。

| 字段 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `name` | string |  | 显示名称。 |
| `baseUrl` | string |  | API 基础 URL。同样适用于该 provider 的内置模型。 |
| `apiKey` | string |  | 字面量 key、"$NAME" 环境变量插值，或 "!command" 的输出。 |
| `api` | string |  | 该 provider 各模型使用的 API，例如 "openai-completions"、"openai-responses"、"anthropic-messages" 或 "google-generative-ai"。 |
| `oauth` | `"radius"` |  | OAuth 登录流程。需要 baseUrl。 |
| `headers` | object |  | 请求 header。值的解析方式与 apiKey 相同。 |
| `compat` | [object](#compatibility) |  | provider 级和模型级的兼容性覆盖。 |
| `authHeader` | boolean | `false` | 是否将解析出的 API key 作为 Authorization: Bearer 发送。 |
| `models` | [`object[]`](#models) |  |  |
| `modelOverrides` | [object](#model-overrides) |  |  |

<a id="models"></a>

## 模型

`models` 中的每个条目都会为 provider 添加一个模型。`id` 与现有模型相同的条目会替换该模型。

| 字段 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `id` | string |  | 必填。发送给 API 的模型 ID。 |
| `name` | string |  | 显示名称，也参与 --model 模式匹配。 |
| `api` | string |  | 覆盖 provider 的 api。 |
| `baseUrl` | string |  | 覆盖 provider 的 baseUrl。 |
| `reasoning` | boolean | `false` | 模型是否支持思考。 |
| `thinkingLevelMap` | object |  | 为每个思考级别发送的 provider 取值。null 表示该级别不受支持。模型未映射的级别使用 provider 的默认值（直到 high）；xhigh 和 max 不受支持。 |
| `input` | `("text" \| "image")[]` | `["text"]` |  |
| `inputLimits` | [object](#input-limits) |  |  |
| `cost` | object |  |  |
| `cost.input` | number |  | 必填。输入费用，单位为美元/百万 token。 |
| `cost.output` | number |  | 必填。输出费用，单位为美元/百万 token。 |
| `cost.cacheRead` | number |  | 必填。缓存读取费用，单位为美元/百万 token。 |
| `cost.cacheWrite` | number |  | 必填。缓存写入费用，单位为美元/百万 token。 |
| `cost.tiers` | `object[]` |  | 请求级定价分段。匹配到的最高输入阈值会应用于整个请求。 |
| `cost.tiers[].inputTokensAbove` | number |  | 必填。当请求输入总量超过此 token 数时使用该分段。 |
| `cost.tiers[].input` | number |  | 必填。输入费用，单位为美元/百万 token。 |
| `cost.tiers[].output` | number |  | 必填。输出费用，单位为美元/百万 token。 |
| `cost.tiers[].cacheRead` | number |  | 必填。缓存读取费用，单位为美元/百万 token。 |
| `cost.tiers[].cacheWrite` | number |  | 必填。缓存写入费用，单位为美元/百万 token。 |
| `promptCache` | object |  | 短时和长时保留级别的尽力而为提示词缓存存活时间（秒）。Pi 只预热有已知存活时间的级别。 |
| `contextWindow` | number | `128000` | 上下文窗口大小，单位为 token。 |
| `maxTokens` | number | `16384` | 最大输出 token 数。 |
| `samplingParams` | object |  | 合并到每个请求体中的字段。仅适用于 OpenAI 兼容 API。 |
| `samplingParamsByThinkingLevel` | object |  | 按思考级别设置 samplingParams，会合并到 samplingParams 之上。 |
| `headers` | object |  | 请求 header。值的解析方式与 apiKey 相同。 |
| `compat` | [object](#compatibility) |  | provider 级和模型级的兼容性覆盖。 |

<a id="model-overrides"></a>

## 模型覆盖

`modelOverrides` 的每个键都是某个内置模型或扩展模型的 ID。未知 ID 会被忽略。对象类型的字段（例如 `cost`）会与模型的取值逐字段合并；其他字段会替换原值。

| 字段 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `name` | string |  | 显示名称，也参与 --model 模式匹配。 |
| `reasoning` | boolean |  | 模型是否支持思考。 |
| `thinkingLevelMap` | object |  | 为每个思考级别发送的 provider 取值。null 表示该级别不受支持。模型未映射的级别使用 provider 的默认值（直到 high）；xhigh 和 max 不受支持。 |
| `input` | `("text" \| "image")[]` |  |  |
| `inputLimits` | [object](#input-limits) |  |  |
| `cost` | object |  |  |
| `cost.input` | number |  | 输入费用，单位为美元/百万 token。 |
| `cost.output` | number |  | 输出费用，单位为美元/百万 token。 |
| `cost.cacheRead` | number |  | 缓存读取费用，单位为美元/百万 token。 |
| `cost.cacheWrite` | number |  | 缓存写入费用，单位为美元/百万 token。 |
| `cost.tiers` | `object[]` |  | 请求级定价分段。匹配到的最高输入阈值会应用于整个请求。 |
| `cost.tiers[].inputTokensAbove` | number |  | 必填。当请求输入总量超过此 token 数时使用该分段。 |
| `cost.tiers[].input` | number |  | 输入费用，单位为美元/百万 token。 |
| `cost.tiers[].output` | number |  | 输出费用，单位为美元/百万 token。 |
| `cost.tiers[].cacheRead` | number |  | 缓存读取费用，单位为美元/百万 token。 |
| `cost.tiers[].cacheWrite` | number |  | 缓存写入费用，单位为美元/百万 token。 |
| `promptCache` | object |  | 短时和长时保留级别的尽力而为提示词缓存存活时间（秒）。Pi 只预热有已知存活时间的级别。 |
| `contextWindow` | number |  | 上下文窗口大小，单位为 token。 |
| `maxTokens` | number |  | 最大输出 token 数。 |
| `samplingParams` | object |  | 合并到每个请求体中的字段。仅适用于 OpenAI 兼容 API。 |
| `samplingParamsByThinkingLevel` | object |  | 按思考级别设置 samplingParams，会合并到 samplingParams 之上。 |
| `headers` | object |  | 请求 header。值的解析方式与 apiKey 相同。 |
| `compat` | [object](#compatibility) |  | provider 级和模型级的兼容性覆盖。 |

<a id="input-limits"></a>

## 输入限制

参见[描述模型输入与缓存](models.md#describe-model-input-and-caching)。

| 字段 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `maxRequestBytes` | integer |  | 序列化后的 provider 请求最大字节数。 |
| `images` | object |  |  |
| `images.resize` | object |  | 新图片进入对话历史之前应用的对缓存安全的 resize 配置。 |
| `images.resize.maxWidth` | integer |  |  |
| `images.resize.maxHeight` | integer |  |  |
| `images.resize.maxBytes` | integer |  | base64 编码后负载的最大字节数。 |
| `images.resize.jpegQuality` | integer |  |  |
| `images.maxPerMessage` | integer |  | 一条 provider 消息中允许的最大图片数。 |
| `images.maxPerRequest` | integer |  | 一次 provider 请求中允许的最大图片数。 |

<a id="compatibility"></a>

## 兼容性

`compat` 用于描述相对某个 API 标准请求与响应行为的、经过验证的差异。模型级取值会按字段覆盖 provider 级取值。实际生效的字段取决于模型的 `api`。

### `openai-completions`

| 字段 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `supportsStore` | boolean |  | provider 是否支持 store 字段。默认：根据 URL 自动检测。 |
| `supportsDeveloperRole` | boolean |  | provider 是否支持用 developer 角色替代 system。默认：根据 URL 自动检测。 |
| `supportsReasoningEffort` | boolean |  | provider 是否支持 reasoning_effort。默认：根据 URL 自动检测。 |
| `supportsUsageInStreaming` | boolean | `true` | provider 是否支持用 stream_options.include_usage 在流式响应中返回 token 用量。 |
| `supportsFinishReason` | boolean | `true` | 流式响应是否包含 finish_reason。为 false 时，pi 在流结束时推断为 stop 或 toolUse。 |
| `maxTokensField` | `"max_completion_tokens" \| "max_tokens"` |  | 用于最大 token 数的字段。默认：根据 URL 自动检测。 |
| `requiresToolResultName` | boolean |  | 工具结果是否要求包含 name 字段。默认：根据 URL 自动检测。 |
| `requiresAssistantAfterToolResult` | boolean |  | 工具结果之后的用户消息是否要求中间有一条 assistant 消息。默认：根据 URL 自动检测。 |
| `requiresNonNullAssistantContent` | boolean |  | 重放的无文本 assistant 消息（例如仅含工具调用的消息）是否必须发送 "" 而不是 null content。默认：false。 |
| `requiresToolsWithToolHistory` | boolean |  | 当对话中包含工具调用或工具结果时，不含工具的请求是否必须发送 "tools": []。Anthropic 前面的一些代理需要该字段，例如较旧版本的 LiteLLM。默认：false，即省略该字段。 |
| `requiresThinkingAsText` | boolean |  | thinking 块是否必须转换为带 &lt;thinking> 分隔符的文本块。默认：根据 URL 自动检测。 |
| `requiresReasoningContentOnAssistantMessages` | boolean |  | 启用 reasoning 时，所有重放的 assistant 消息是否必须包含空的 reasoning_content 字段。默认：根据 URL 自动检测。 |
| `thinkingFormat` | `"openai" \| "openrouter" \| "deepseek" \| "together" \| "baseten" \| "zai" \| "qwen" \| "chat-template" \| "qwen-chat-template" \| "string-thinking" \| "ant-ling"` |  | reasoning 或 thinking 参数的格式。省略时，Pi 会根据 provider URL 自动检测格式。"openai" 使用 reasoning_effort，"openrouter" 使用 reasoning.effort，"deepseek" 使用 thinking.type，并在支持时使用 reasoning_effort，"together" 使用 reasoning.enabled，并在支持时使用 reasoning_effort，"baseten" 使用可配置的 chat_template_args，并在支持时使用 reasoning_effort，"zai" 使用 thinking.type，"qwen" 使用顶层的 enable_thinking，"qwen-chat-template" 使用 chat_template_kwargs.enable_thinking 和 preserve_thinking，"chat-template" 使用可配置的 chat_template_kwargs，"string-thinking" 使用顶层的 thinking，"ant-ling" 仅在映射后的 effort 非 null 时使用 reasoning.effort。 |
| `chatTemplateKwargs` | object |  | 当 thinkingFormat 为 "chat-template" 时作为 chat_template_kwargs 发送的 kwargs。用 $var 配合 "thinking.enabled"、"thinking.effort" 或 "thinking.budget" 表示由 pi 控制的值。 |
| `chatTemplateArgs` | object |  | 当 thinkingFormat 为 "baseten" 时作为 chat_template_args 发送的参数。用 $var 配合 "thinking.enabled"、"thinking.effort" 或 "thinking.budget" 表示由 pi 控制的值。 |
| `openRouterRouting` | object |  | OpenRouter 的 provider 路由偏好。控制 OpenRouter 把请求路由到哪些上游 provider。作为 OpenRouter API 请求体中的 provider 字段发送。参见 https://openrouter.ai/docs/guides/routing/provider-selection。 |
| `vercelGatewayRouting` | object |  | Vercel AI Gateway 的路由偏好。控制网关把请求路由到哪些上游 provider。参见 https://vercel.com/docs/ai-gateway/models-and-providers/provider-options。 |
| `zaiToolStream` | boolean | `false` | z.ai 是否支持用顶层 tool_stream 流式传输工具调用增量。 |
| `thinkingTokenBudgetField` | `"thinking_token_budget" \| "thinking_budget" \| "thinking_budget_tokens"` |  | 用于限制 thinkingBudgets 推理 token 的顶层请求字段。在这些端点上，推理和答案共享 max_tokens。"thinking_token_budget" 对应 vLLM，"thinking_budget" 对应 Qwen、DashScope 或 SGLang，"thinking_budget_tokens" 对应 llama.cpp。默认关闭，且不在生成的目录中设置。 |
| `supportsThinkingTokenBudget` | boolean | `false` | thinkingTokenBudgetField 的别名："thinking_token_budget"（vLLM）。建议优先使用 thinkingTokenBudgetField。 |
| `supportsOpenAIGrammarTools` | boolean | `false` | provider 是否支持使用 Lark 或 regex 语法格式的 OpenAI 自定义工具。为 false 时，语法约束的工具回退为普通函数工具。生成的目录会为支持的模型启用该字段。 |
| `supportsMidConvoSystemMessages` | boolean | `false` | 该模型是否接受在对话开始之后出现的 system 或 developer 消息。为 false 时，后续 system 消息会被折叠进开头的 system 消息。生成的目录会为已验证的模型启用该字段。 |
| `supportsMidConvoToolAdditions` | boolean | `false` | system 消息能否在对话中途引入额外的工具。需要 supportsMidConvoSystemMessages。生成的目录会为支持的模型启用该字段。 |
| `supportsStrictMode` | boolean | `false` | provider 是否支持工具定义中的 strict 字段。生成的目录会为支持的模型显式启用。 |
| `cacheControlFormat` | `"anthropic"` |  | 提示词缓存的缓存控制约定。Anthropic 会在系统提示词、最后一个工具定义以及最后一条 user、assistant 或 tool-result 文本内容上应用 cache_control 标记。 |
| `sendSessionAffinityHeaders` | boolean |  | 是否根据 options.sessionId 发送会话亲和性数据。默认：OpenRouter 端点为 true，其他为 false。 |
| `sessionAffinityFormat` | `"openai" \| "openai-nosession" \| "openrouter"` |  | 会话亲和性 header 格式。openai 发送 session_id、x-client-request-id 和 x-session-affinity；openai-nosession 发送 x-client-request-id 和 x-session-affinity；openrouter 发送 x-session-id。不影响 prompt_cache_key。默认：自动检测。 |
| `promptCacheKeyMode` | `"auto" \| "enabled" \| "disabled"` |  | 控制 prompt_cache_key 请求字段。auto 会把它发送给 api.openai.com，或者在 supportsLongCacheRetention 为 true 时随长时缓存保留一起发送；enabled 在缓存生效时始终发送，适用于兼容代理；disabled 从不发送。默认：auto。 |
| `supportsLongCacheRetention` | boolean |  | provider 是否支持长时提示词缓存保留（prompt_cache_retention: "24h"，或按格式使用 Anthropic 风格的 cache_control.ttl: "1h"）。默认：根据 provider 和 URL 自动检测。 |
| `vllmPriority` | number |  | 作为顶层 priority 请求字段发送的 vLLM 调度优先级。数值越小越早处理，服务器默认为 0。仅在 --scheduling-policy priority 时有意义。默认关闭，且不在生成的目录中设置。 |

### `openai-responses`

同样适用于 `azure-openai-responses` 和 `openai-codex-responses`。

| 字段 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `supportsDeveloperRole` | boolean | `true` | provider 是否支持用 developer 角色替代 system。 |
| `supportsMidConvoSystemMessages` | boolean | `false` | 该模型是否接受在对话开始之后出现的 developer 或 system 消息。为 false 时，后续 system 消息会被折叠进开头的 system 消息。生成的目录会为已验证的模型启用该字段。 |
| `sessionAffinityFormat` | `"openai" \| "openai-nosession" \| "openrouter"` |  | 会话亲和性 header 格式。openai 发送 session-id 和 x-client-request-id；openai-nosession 发送 x-client-request-id；openrouter 发送 x-session-id。不影响 prompt_cache_key。默认：自动检测。 |
| `promptCacheKeyMode` | `"auto" \| "enabled" \| "disabled"` |  | 控制 prompt_cache_key 请求字段。auto 和 enabled 在缓存生效时发送它；disabled 从不发送，适用于拒绝该字段的兼容代理。默认：auto。 |
| `supportsLongCacheRetention` | boolean | `true` | provider 是否支持长时提示词缓存保留。在 GPT-5.6+ 上使用 prompt_cache_options.ttl: "30m"，在更早的模型上使用 prompt_cache_retention: "24h"。 |
| `supportsStrictMode` | boolean |  | provider 是否支持 strict JSON schema 函数工具。默认值因 API 而异；生成的 OpenAI 模型会显式启用。 |
| `supportsOpenAIGrammarTools` | boolean | `false` | 是否发送使用 Lark 或 regex 语法格式的 OpenAI 自定义工具。为 false 时，语法约束的工具回退为普通函数工具。生成的目录会为支持的模型启用该字段。 |
| `supportsAdditionalTools` | boolean | `false` | 模型是否支持按消息锚定的 additional_tools 输入项。 |
| `supportsToolSearch` | boolean | `false` | 模型是否支持为按对话记录锚定的新增内容执行客户端工具搜索。 |
| `supportsExplicitPromptCacheMode` | boolean | `false` | 模型是否接受 prompt_cache_options。较旧的 OpenAI 模型会拒绝该参数。 |
| `supportsMidConvoEffort` | boolean | `false` | 思考级别变更是否以 configuration_update 输入项发送，而不是修改 reasoning.effort，从而在变更后仍保留提示词缓存。仅由 openai-responses API 使用，在 openai provider 上使用 ChatGPT 登录时会被忽略。 |
| `supportsMaxOutputTokens` | boolean | `true` | provider 是否接受 max_output_tokens。某些 Codex 协议网关会拒绝它。 |

### `anthropic-messages`

| 字段 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `supportsEagerToolInputStreaming` | boolean | `true` | provider 是否接受每个工具的 eager_input_streaming。为 false 时，Anthropic provider 会省略 tools[].eager_input_streaming，并为启用工具的请求发送旧版 fine-grained-tool-streaming-2025-05-14 beta header。 |
| `supportsLongCacheRetention` | boolean | `true` | provider 是否支持通过 cache_control.ttl 使用 Anthropic 的长时缓存保留。 |
| `sendSessionAffinityHeaders` | boolean |  | 启用缓存时，是否根据 options.sessionId 发送 x-session-affinity。对于 Fireworks 这类使用会话亲和性进行提示词缓存路由的 provider，该字段是必需的；发往同一副本的请求可以最大化缓存命中。默认：OpenRouter 端点为 true，其他为 false。 |
| `sessionAffinityFormat` | `"openrouter"` |  | 会话亲和性格式。openrouter 发送 x-session-id；未设置时发送 x-session-affinity。 |
| `supportsCacheControlOnTools` | boolean | `true` | provider 是否支持在工具定义上使用 Anthropic 风格的 cache_control 标记。为 false 时，工具参数中会省略 cache_control。某些 Anthropic 兼容 provider（例如 Fireworks）不支持工具上的该字段，可能会拒绝或忽略它。 |
| `supportsTemperature` | boolean | `true` | 模型是否接受 Anthropic 的 temperature 请求字段。Claude Opus 4.7+ 会拒绝非默认值。 |
| `forceAdaptiveThinking` | boolean | `false` | 是否无论模型 ID 如何都强制使用自适应思考（thinking.type: adaptive 加 output_config.effort）。需要自适应思考的内置模型会在生成的元数据中设置该字段。自定义 Anthropic 兼容 provider 可以为任何其上游要求自适应格式的模型把它设为 true。在覆盖过的内置模型上设为 false 可退出该行为。 |
| `allowEmptySignature` | boolean | `false` | 是否重放空的 thinking 签名，而不是把 thinking 转换为文本。 |
| `supportsStrictTools` | boolean | `false` | provider 是否支持 Anthropic 严格工具 schema。生成的 Anthropic 模型会显式启用。 |
| `supportsMidConvoEffort` | boolean | `false` | 该模型的传输层是否支持仅含 effort 的 system 消息和 thinking 绑定控制。 |
| `supportsMidConvoSystemMessages` | boolean | `false` | 该模型是否接受对话内部的 system 角色消息。为 false 时，后续 system 消息会被折叠进顶层系统提示词。 |
| `supportsMidConvoToolChanges` | boolean | `false` | 该模型是否接受对话中途的 tool_addition 和 tool_removal 块。需要 supportsMidConvoSystemMessages。 |
| `supportsMessageThreads` | boolean |  | 端点是否支持 Anthropic 的消息线程（message threads），即携带会话 id 的请求只需发送新消息并从上一条回复继续。默认：baseUrl 位于 api.anthropic.com 时为 true，其他为 false。对于转发 thread 请求字段的网关，请设为 true。 |
| `allowedFallbackModels` | `object[]` |  | Anthropic 允许用于服务端拒答回退的模型，并附带用于返回的回退响应的本地定价元数据。缺省或为空时，调用方必须省略 fallbacks；对于没有允许回退目标的模型，Anthropic 会拒绝该字段。 |

### `bedrock-converse-stream`

| 字段 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `supportsStrictMode` | boolean | `false` | 模型是否支持 Bedrock 严格工具 schema。 |

### `mistral-conversations`

| 字段 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `supportsMidConvoSystemMessages` | boolean | `false` | 该模型是否接受在对话开始之后出现的 system 消息。为 false 时，后续 system 消息会被折叠进开头的 system 消息。 |

### `typesafe-system-one`

同样适用于 `cloudflare-workers-ai-system-one`。

| 字段 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `imageInput` | `"assets" \| "images" \| "state-image-urls"` |  | 服务接收分类器图片的方式。"assets" 发送 TypeSafe 的 assets map（PNG 和 JPEG），并从 state 中引用这些图片，这正是 TypeSafe 和 Workers AI 上的 Jev 所期望的。"images" 发送 Clef 的 data URL 图片列表（PNG、JPEG 和 WebP，最多四张），这正是 Workers AI 上的 Clef 所期望的。"state-image-urls" 把 image_url 部分放在 state 之前，这正是 OpenRouter 所期望的；OpenRouter 会丢弃 assets 而不报错。根据 provider、baseUrl 和模型 ID 自动检测。分类器模型从 provider 级 compat 读取该字段；模型和 modelOverrides 条目仅适用于 chat 模型。 |
| `sendImageOptInHeader` | boolean |  | 带图片的请求是否发送 TypeSafe-Danger-Zone-Images: true header，TypeSafe 自家 API 的实验性图片输入要求该 header。对于 typesafe-system-one API 默认为 true，除非检测到模型是 OpenRouter。 |
