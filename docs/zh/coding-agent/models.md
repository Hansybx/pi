> 这是简体中文译本，译自 `packages/coding-agent/docs/models.md`。与英文原文如有出入，以原文为准。

# 选择模型

对于内置 provider（提供商），先用 `/login` 登录，再用 `/model` 选择模型。只有当 Pi 尚未内置你需要的 provider 或端点时，才需要使用自定义模型配置。

## 选择连接方式

| 你的情况 | 推荐配置 |
|---|---|
| 受支持的订阅 | 通过 `/login` 登录 |
| provider API key | 通过 `/login` 存储，或设置其环境变量 |
| 本地 GGUF 模型 | 让 Pi 连接 llama.cpp router |
| OpenAI、Anthropic 或 Google 兼容的端点 | 将其添加到 `models.json` |
| 使用自定义协议或认证流程的 provider | 构建或安装 provider 扩展 |

浏览 [模型目录](https://pi.dev/models) 了解当前的 provider、模型 ID、能力、上下文上限和定价。Pi 从内置目录启动，并可叠加来自 pi.dev 的更新目录数据。缓存的目录数据在离线时仍可用；运行 `pi update --models` 可强制刷新。

## 认证

运行 `/login` 并选择一个 provider。Pi 将凭证存储在 [`auth.json`](configuration.md#agent-directory) 中。运行 `/logout` 可删除某个 provider 已存储的凭证。

你也可以通过 provider 的环境变量提供 API key。这在 CI 以及其他不希望 Pi 写入凭证的环境中很有用。[Providers](providers.md) 列出了这些变量以及各 provider 的专用配置。

当配置了多个凭证来源时，Pi 优先使用运行时传入的 `--api-key`，其次是存储的 `auth.json` 凭证、`models.json` 中的 `apiKey`，最后是 provider 的环境变量或环境中的云凭证。provider 扩展可以定义自己的认证行为。

请妥善保管 `auth.json` 以及任何涉及凭证的命令。在你信任某个项目之后，该项目的设置和扩展就能在 Pi 进程内执行。从不受信任的目录加载配置之前，请先阅读 [安全](security.md)。

## 选择模型

运行 `/model` 搜索可用模型。选择器只显示其 provider 具有可用认证的模型。在某个模型上按 `Ctrl+S` 可将其保存为新会话的默认模型。

运行 `/thinking` 为当前模型选择思考级别。在该处按 `Ctrl+S` 可保存启动时使用的级别。Pi 只提供所选模型支持的级别。

`Ctrl+P` 在可用模型之间循环切换。使用 `/scoped-models` 可以控制该循环并保存选择，也可以通过[设置](settings.md#model-cycling)配置模型匹配模式。

会话会记录模型和思考级别的变更。恢复会话时会还原这些设置，但不会改变新会话的默认值。

## 连接本地模型

Pi 直接与 llama.cpp router 集成。该 router 会发现 GGUF 文件并按需加载模型。Pi 的 `/llama` 命令用于管理 router，`/model` 用于选择其中一个已加载的模型。

服务器启动、模型布局、下载以及连接问题排查请参阅 [Local Models with llama.cpp](llama-cpp.md)。

对于 Ollama、LM Studio、vLLM、SGLang 以及其他兼容服务器，请在 `models.json` 中[配置兼容端点](#configure-a-compatible-endpoint)。

<a id="configure-a-compatible-endpoint"></a>

## 配置兼容端点

当某个端点使用 Pi 已支持的 API 时，请使用 [`models.json`](configuration.md#agent-directory)。这涵盖大多数 Ollama、LM Studio、vLLM、SGLang 和代理部署。

```json
{
  "$schema": "https://pi.dev/schemas/models.schema.json",
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        { "id": "qwen2.5-coder:7b" }
      ]
    }
  }
}
```

这个占位的 key 只是让模型对 Pi 可用；Ollama 会忽略它。对于需要认证的端点，`apiKey` 和 header 值可以使用 `$NAME` 或 `${NAME}` 环境变量插值、字面值，或以 `!command` 开头的命令。`$$` 和 `$!` 会分别产生字面量 `$` 和 `!`。`models.json` 中的命令在请求时执行，Pi 不会缓存结果。

打开 `/model` 会重新加载该文件。`models` 中的条目会在该 provider 上新增模型，或替换 ID 相同的模型。使用 `modelOverrides` 可以在不替换 provider 模型列表的前提下，修改已有内置模型或扩展提供的模型的元数据。未知的覆盖 ID 会被忽略。

若要某个内置 provider 通过代理访问，只需设置它的 `baseUrl`。它的模型和认证保持不变：

```json
{
  "providers": {
    "anthropic": { "baseUrl": "https://proxy.example.com/v1" }
  }
}
```

[模型配置](models-configuration.md) 列出了所有字段。

### 描述模型输入与缓存

使用 `inputLimits.images.resize` 控制 Pi 在把新图片附件、`read` 结果和工具结果图片存入对话历史之前如何编码它们：

```json
{
  "id": "vision-model",
  "input": ["text", "image"],
  "inputLimits": {
    "images": {
      "resize": {
        "maxWidth": 1568,
        "maxHeight": 1568,
        "maxBytes": 524288,
        "jpegQuality": 75
      }
    }
  }
}
```

`maxBytes` 限制 base64 编码后的负载大小。未指定的 resize 字段使用保守默认值：2000×2000 像素、编码后 4.5 MiB、JPEG 质量 80。图片只编码一次；切换模型不会重写历史图片。目录还可以用 `inputLimits.maxRequestBytes`、`images.maxPerMessage` 和 `images.maxPerRequest` 描述硬性请求上限，但 Pi 目前还不会据此重写或拒绝历史记录。

<a id="prompt-cache-lifetimes"></a>

使用 `promptCache` 声明 provider 在 `short` 或 `long` 保留级别下的尽力而为缓存存活时间（秒）：

```json
{ "id": "claude-sonnet-5", "promptCache": { "short": 300, "long": 3600 } }
```

在官方公布的区间里请选较保守的一端。对当前生效级别没有声明存活时间的模型不参与缓存预热。`modelOverrides` 条目可以为内置模型或扩展模型设置 `inputLimits` 或 `promptCache`，包括通过已验证代理访问的模型。参见 [`cacheWarming`](settings.md#model-and-thinking)。

### 按思考级别配置采样

OpenAI 兼容 API 支持自由形式的 `samplingParams` 模型默认值，以及 `samplingParamsByThinkingLevel` 覆盖值。后者使用 Pi 的思考级别键名（`off`、`minimal`、`low`、`medium`、`high`、`xhigh` 和 `max`），而不是 `thinkingLevelMap` 中的 provider 取值：

```json
{
  "id": "qwen-thinking-model",
  "reasoning": true,
  "samplingParams": {
    "temperature": 1.0,
    "top_p": 0.95
  },
  "samplingParamsByThinkingLevel": {
    "off": {
      "temperature": 0.7,
      "top_p": 0.8
    },
    "high": {
      "top_k": 20
    }
  }
}
```

Pi 先钳制不受支持的思考级别，然后按此顺序合并模型的 `samplingParams`、生效级别的覆盖值以及请求级的 `samplingParams`。后面的值按 key 覆盖前面的值。缺少的级别继承模型默认值。`modelOverrides` 按 key 把各分级的条目与基础模型合并。这些字段只适用于 `openai-completions`、`openai-responses` 和 `azure-openai-responses`；其他 API 会忽略它们。

兼容性设置应当用来描述已经验证过的、端点请求或响应行为上的差异。不要仅仅因为某个端点宣称兼容 OpenAI 或 Anthropic 就启用它们。

## 使用分类器模型

分类器模型不进行对话。它们针对 JSON 状态回答有类型的问题：从若干选项中选一个、回答是或否，或给出一个分数，每种答案都附带概率。Pi 内置了这些 provider 的 TypeSafe Jev 模型、Workers AI 和 OpenRouter 上的 Cloudflare Clef、Clef Flash 和 Clef Omni 模型、通过 [Decisions API](https://developers.openai.com/api/docs/guides/decisions) 访问的 OpenAI GPT-6 Luna，以及通过 GitHub Copilot 访问的 Microsoft-Decision-1：

| provider | 模型 ID | 认证 |
|---|---|---|
| `typesafe` | `jev-latest` | `TYPESAFE_API_KEY` |
| `openrouter` | `typesafe/jev-1.13`, `typesafe/jev-1.14`, `~typesafe/jev-latest`, `cloudflare/clef`, `cloudflare/clef-flash`, `cloudflare/clef-omni` | `OPENROUTER_API_KEY` 或 `/login` |
| `cloudflare-workers-ai` | `typesafe/jev`, `typesafe/jev-1.14.0`, `@cf/cloudflare/clef`, `@cf/cloudflare/clef-flash`, `@cf/cloudflare/clef-omni` | `CLOUDFLARE_API_KEY` 和 `CLOUDFLARE_ACCOUNT_ID` |
| `vercel-ai-gateway` | `typesafe-ai/jev` | `AI_GATEWAY_API_KEY` |
| `opencode` | `jev-1.13`, `jev-1.13-free` | `OPENCODE_API_KEY` |
| `openai` | `gpt-6-luna` | `OPENAI_API_KEY` |
| `github-copilot` | `microsoft-decision-1` | `COPILOT_GITHUB_TOKEN` 或 `/login` |

[llama.cpp router](llama-cpp.md#classification) 上的 chat 模型也会被列为分类器模型。

OpenAI 的 Decisions API 需要 API key。使用 ChatGPT 凭证登录对它无效，因此当 `openai` 通过 `/login` 登录时，即使设置了 `OPENAI_API_KEY`，`gpt-6-luna` 也不会显示为可用；请登出 `openai` 以使用该 key。该 API 会拒绝超过 922K token 的输入，但耗时超过约五秒的请求（目前大约是输入超过 600K token）会以网关超时失败。

分类器模型不会出现在 `/model` 中。模型通过 [`codemode`](cli.md#enable-codemode) 工具访问它们，该工具默认关闭，除非某个 MCP 服务器把它打开。在[设置](settings.md#tools)中用 `"defaultTools": ["+codemode"]` 可以启用它。之后脚本可以用 `models.getAvailableOfType("classifier")` 列出分类器模型，并调用 `models.classify(model, { state, questions })`：

```js
const jev = await models.getModelOfType("classifier", "typesafe", "jev-latest");
const result = await models.classify(jev, {
  state: { message: "The change works, thanks." },
  questions: {
    approved: {
      type: "bool",
      instructions: "Does the user approve of the result?",
      criteria: { true: "Approval", false: "No approval" },
    },
  },
});
return result.answers;
```

[Codemode](codemode.md#classify) 介绍了问题和答案的类型。

`input` 中包含 `"image"` 的分类器模型还会评判通过 `images` 传入的图片；其他分类器模型遇到图片会返回错误。图片输入可用于 GPT-6 Luna，可用于 `typesafe` 和 `cloudflare-workers-ai` 上的 Jev，可用于 `cloudflare-workers-ai` 上的 Clef，也可用于目录中标注了图片输入的 OpenRouter 模型。Jev 接受 PNG 和 JPEG 图片，且图片输入在 TypeSafe 自家 API 上仍是实验性功能。Clef 接受 PNG、JPEG 和 WebP 图片，每个请求最多四张。`vercel-ai-gateway` 和 `opencode` 上的 Jev 仅接受文本。

每个 System One 服务都以各自的请求格式接收图片，该格式由模型的 `compat.imageInput` 指定。内置模型已设置它，因此覆盖 provider 的 `baseUrl` 后仍然有效。代理其他服务分类器的自定义 provider 需要在 `models.json` 的 provider 级 `compat` 中设置它（参见 [System One 兼容性](models-configuration.md#typesafe-system-one)）。尤其是 OpenRouter，它会以 TypeSafe 的格式返回响应而不报错，但会丢弃图片。

当服务报告 token 数时（所有 System One 服务都会报告），`result.usage` 会连同费用一起给出这些数据。Pi 会把脚本中分类器调用的用量累加到 `codemode` 工具结果，因此它会计入页脚和 `/session` 显示的会话费用。费用按模型的目录价格计算；没有目录价格的模型（例如 TypeSafe 直连的 `jev-latest`）会报告 token 数但不计费用。

扩展通过 `ctx.modelRegistry.classify()` 调用分类器，无需 codemode。[虚拟模型](virtual-models.md#route-requests) 可以用它们来路由请求；参见 `jev-router.ts` 示例。

## 使用图像模型

图像模型根据提示词和可选的输入图片生成图像。Pi 在 `openrouter` provider 下列出了 OpenRouter 的图像模型，例如 `google/gemini-2.5-flash-image` 和 `black-forest-labs/flux.2-pro`；它们使用与其 chat 模型相同的 `OPENROUTER_API_KEY` 或 `/login` 凭证。

与分类器模型一样，图像模型不会出现在 `/model` 中；模型通过 [`codemode`](cli.md#enable-codemode) 工具访问它们。脚本用 `models.getAvailableOfType("image")` 列出它们，并调用 `models.generateImages(model, { input })`。结果的 `output` 保存 base64 图像块，`image()` 会把这些块附加到 `codemode` 结果上，让模型能看到它们：

```js
const painter = await models.getModelOfType("image", "openrouter", "google/gemini-2.5-flash-image");
const result = await models.generateImages(painter, {
  input: [{ type: "text", text: "A red fox in the snow, watercolor" }],
});
if (result.stopReason !== "stop") return result.errorMessage;
for (const block of result.output) if (block.type === "image") image(block);
```

`input` 还可以包含 `{ type: "image", data, mimeType }` 块，用于编辑图片或作为参考图。与分类器调用一样，Pi 会把脚本中图像调用的用量累加到 `codemode` 工具结果。生成的图片不会保存到磁盘。[Codemode](codemode.md#generate-images) 介绍了完整的 API。

扩展通过 `ctx.modelRegistry.generateImages()` 生成图像，无需 codemode。

## 添加自定义 provider

当 provider 需要自定义流式输出、模型发现或认证行为时，请使用扩展。扩展的编写流程参见 [自定义 Provider](custom-provider.md)。

## 问题排查

### 模型没有出现

确认它的 provider 具有可用的认证。自定义模型可以从 `models.json` 加载，但在 Pi 能解析出凭证之前，它们在 `/model` 中仍不可用。对于 llama.cpp，只会显示 router 当前已加载的模型。

### 认证只在某个 shell 中生效

检查该 key 是否来自环境变量而不是 `auth.json`。环境变量必须存在于启动 Pi 的进程中。

### 登录在远程机器上打开浏览器

如果 provider 提供无头认证流程，请使用该流程。某些 provider 允许你把最终的跳转 URL 或授权码粘贴回 Pi。参见 [交互式认证](providers.md#authenticate-interactively)。

### 兼容端点拒绝请求

检查它在 `models.json` 中的 API 类型和兼容性设置。上游服务器必须支持相应的请求字段和行为。
