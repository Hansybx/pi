> 这是简体中文译本，译自 `packages/coding-agent/docs/codemode.md`。与英文原文如有出入，以原文为准。

# Codemode

`codemode` 工具让模型编写一段 JavaScript 脚本，用以调用 pi 的其他工具并运行非 LLM 模型，例如分类器和图像模型。只有脚本的输出会到达模型，因此脚本可以并行执行调用，并在模型看到之前过滤掉大量结果。要启用它，见[启用 codemode](cli.md#enable-codemode)。

## 脚本

工具输入是原始 JavaScript 源码，不是 JSON，也不是 markdown 代码围栏。它作为一个 async 函数体在 QuickJS 沙箱中运行，因此顶层 `await` 和 `return` 可用。沙箱没有 Node API、文件系统、网络和定时器；脚本只能通过工具和 `models` 接触外部世界。

脚本可以以选项行开头。该行必须是第一行；选项行出现在其他任何位置都会让调用在脚本运行之前失败：

```js
// @options: {"max_output_tokens": 2000, "timeout_ms": 60000}
```

- `max_output_tokens`（默认 10000）限制输出。更长的输出保留开头和结尾，完整文本写入临时文件，其路径包含在结果中。当脚本输出的文本与 base64 图像数据合计超过 16777216 个字符，或 `text()`、`image()` 和 `console` 调用超过 100000 次时，脚本失败；请改用工具把大数据写入文件。
- `timeout_ms` 是整个脚本的硬性截止时间，包括等待空闲 worker 的时间。默认未设置。图像生成可能耗时数分钟，因此不要为生成图像的脚本设置很短的截止时间。

结果以 `Script completed` 或 `Script failed`、实际耗时和输出开头。文本项和图像项按顺序出现，各占一行。当输出中有多个文本项（来自 `text()` 或 `return`）时，每一项都以 `==> text N/M <==` 行开头。`console` 调用随后出现在一个 `<console_output>` 块中，每次调用一行。失败的脚本保留其部分输出，随后是 `Script error:` 和错误信息。工具调用是真实的：失败之前所做的调用不会撤销。脚本结束时仍在运行的调用会被取消，未被 await 的 promise 会被丢弃。

## 全局对象

| 全局 | 用途 |
|---|---|
| `tools.<name>(args)` | 调用工具。见[调用工具](#call-tools)。 |
| `text(value)` | 向输出添加一个文本项。字符串按原样添加，其他值作为 JSON 添加。 |
| `image(value)` | 向输出添加一张图像：base64 `data:` URL、`{ image_url }` 对象，或形如 MCP 工具和 `models.generateImages()` 返回的图像块 `{ type: "image", data, mimeType }`。不支持远程 URL。接受 PNG、JPEG、GIF 和 WebP。每张图像也会保存到临时文件，结果中在该图像之前标明路径。 |
| `console.log(...)` | 在其他输出之后向 `<console_output>` 块添加一行。参数以空格连接；`info`、`warn`、`error` 和 `debug` 行为相同。 |
| `return value` | 顶层 `return` 会像 `text()` 一样添加该值。 |
| `exit()` | 成功结束脚本。 |
| `store(key, value)` / `load(key)` | 跨 `codemode` 调用保存小的 JSON 值。见[存储值](#store-values)。 |
| `ALL_TOOLS` | 每个可调用工具，形式为 `{ name, description }`，包括描述中未列出的工具。 |
| `searchTools(query, { limit?, namespace? })` | 按相关性对可调用工具排序（BM25，默认 limit 为 8）。解析为 `{ name, description }[]`。 |
| `describeTool(name)` | 解析为工具的描述和 TypeScript 声明，或 `undefined`。 |
| `describeNamespace(name)` | 解析为某个命名空间（例如某个 MCP 服务器）的 `{ name, description?, instructions?, tools }`，或 `undefined`。 |
| `models` | 列出并运行非 LLM 模型。见[模型](#models)。 |

<a id="call-tools"></a>

## 调用工具

会话可以调用的每个工具都是 `tools` 的方法，以其标识符命名：在 JavaScript 标识符中不合法的字符会变成 `_`，因此 MCP 工具 `mcp__dev-radius__search` 是 `tools.mcp__dev_radius__search`。每个方法接收一个包含该工具参数的对象。

一次调用解析成什么取决于工具：

- 带输出 schema 的工具解析为结构化值。`bash` 解析为 `{ output, truncated, full_output_path?, exit_code, wall_time_seconds }`，退出码非零时也是如此。它的 `output` 不限于模型看到的 2000 行或 50KB：它最多容纳 1 MiB，更长的输出保留前后各 512 KiB 并夹一个省略标记，同时 `truncated` 被设置，完整输出在 `full_output_path` 中。
- MCP 工具解析为其 `CallToolResult`，包括 `isError` 和 `structuredContent`。
- `read` 解析为文件文本，如果是图像则解析为 `image()` 可显示的图像块 `{ type: "image", data, mimeType, note }`。`data` 是模型会看到的 base64 图像，`note` 是随附的文本，例如尺寸调整提示。
- 其他工具（例如 `edit` 和 `write`）解析为其文本输出。

失败、被阻塞或参数无效的调用会以一个携带该工具错误文本的 `Error` 拒绝（reject）。使用 `Promise.allSettled()` 保留成功调用的结果。

`codemode` 的描述列出工具及其 TypeScript 声明，并按命名空间分组（例如一个 MCP 服务器）。以 `deferred` 暴露的工具不会列出，其中包括使用默认 `codemode` 暴露方式的 MCP 工具，因此 MCP 服务器连接时该描述保持不变。列出的声明共享 3000 个估算 token 的预算（[设置](settings.md#tools)中的 `codemode.inlineBudget`）。脚本可通过 `searchTools()`、`describeTool()`、`describeNamespace()` 或筛选 `ALL_TOOLS` 找到其他工具。

`codemode` 处于活动状态时，[设置](settings.md#tools)中的 `codemode.mode` 决定其他工具如何呈现。使用 `on`（默认）时，已声明的工具保持声明状态，其描述说明如何从脚本中调用它们。使用 `only` 时，它们对模型隐藏，改为在 `codemode` 描述中列出，因此模型通过脚本调用它们。`codemode` 描述、`describeTool()` 和 `ALL_TOOLS` 中的工具声明会附带这些工具的提示词指南，因为系统提示词规则只涵盖已声明的工具。

<a id="store-values"></a>

## 存储值

`store(key, value)` 把一个 JSON 值以字符串键保存，供后续 `codemode` 调用使用；存储 `undefined` 会删除该键。`load(key)` 返回该值，或 `undefined`。只有脚本成功时写入才会保留：每个成功存储值的脚本都会向会话追加一个 `codemode-store` 自定义条目，因此恢复的会话会保留这些值，而每个分支只看到其路径上写入的值。

存储用于 ID、游标或摘要这类小状态。单个值最多 262144 个字符的 JSON，所有值合计最多 1048576 个字符。不要存储图像数据；用 `image()` 显示图像，它也会把图像保存到临时文件。

<a id="models"></a>

## 模型

`models` 使用会话的凭证访问模型目录并运行非 LLM 模型：分类器，回答关于 JSON 状态以及（对某些模型而言）图像的类型化问题；以及图像模型，生成图像。聊天模型会被列出，但不能从脚本中运行。存在哪些分类器模型和图像模型，见[使用分类器模型](models.md#use-classifier-models)和[使用图像模型](models.md#use-image-models)。

```ts
type ModelType = "chat" | "image" | "classifier";

/** A catalog entry. `provider` and `id` identify it; other fields depend on the type. */
interface ModelInfo {
  type?: ModelType;
  provider: string;
  id: string;
  name: string;
  api: string;
  input: ("text" | "image")[];
  contextWindow?: number;
  [key: string]: unknown;
}

declare const models: {
  /** Every known model of a type, optionally for one provider. */
  getModelsOfType(type: ModelType, provider?: string): Promise<ModelInfo[]>;
  /** Models of a type whose provider has working credentials. */
  getAvailableOfType(type: ModelType, provider?: string): Promise<ModelInfo[]>;
  /** One catalog entry, or undefined. */
  getModelOfType(type: ModelType, provider: string, id: string): Promise<ModelInfo | undefined>;
  /** Answer `context.questions` about `context.state`; answers are in `result.answers` by question ID. */
  classify(model: ModelInfo, context: ClassifierContext): Promise<ClassifierResult>;
  /** Generate images from `context.input` text and image blocks; show `result.output` blocks with image(). Can take minutes. */
  generateImages(model: ModelInfo, context: ImagesContext): Promise<ImagesResult>;
};
```

`classify()` 和 `generateImages()` 只使用 `model` 的 `provider` 和 `id`，因此 `{ provider, id }` 同样可用。它们不会因 provider（提供商）错误而抛出异常：请检查 `stopReason` 和 `errorMessage`。每个脚本中最多同时运行四个此类调用；更多调用会等待空闲槽位，因此对多个条目使用 `Promise.all()` 没有问题。它们的用量会加入 `codemode` 工具结果，并计入会话成本。

不同 provider 的模型 ID 不同，例如 `typesafe/jev-latest` 和 `openrouter/typesafe/jev-1.13`。使用 `models.getAvailableOfType(type)` 找出可用当前凭证工作的 ID。

### 分类

```ts
interface ClassifierContext {
  /** The data to classify. */
  state: Record<string, unknown>;
  /** Images judged together with `state`. Only models whose `input` includes "image" accept them. */
  images?: { type: "image"; data: string; mimeType: string }[];
  /** Questions by ID. One call answers all of them. */
  questions: Record<string, ClassifierQuestion>;
}

type ClassifierQuestion =
  /** Pick one label. `criteria` maps each label to what it means. */
  | { type: "choice"; instructions: string; criteria: Record<string, string> }
  /** Score on an ordered scale. `criteria` describes each level, lowest first. */
  | { type: "score"; instructions: string; criteria: string[] }
  /** Yes or no. */
  | { type: "bool"; instructions: string; criteria: { true: string; false: string } };

interface ClassifierResult {
  provider: string;
  model: string;
  /** Answers by question ID. */
  answers: Record<string, ClassifierAnswer>;
  usage?: ModelUsage;
  stopReason: "stop" | "error" | "aborted";
  errorMessage?: string;
}

type ClassifierAnswer =
  | { type: "choice"; choice: string; probabilities: Record<string, number>; confidence: number }
  /** `score` is the expected level index, from 0 to `criteria.length - 1`. */
  | { type: "score"; score: number; confidence: number }
  /** Probability of `true`. */
  | { type: "bool"; probability: number };

/** Token counts and cost in USD, when the service reports them. */
type ModelUsage = { input: number; output: number; totalTokens: number; cost: { total: number } };
```

通过为每个条目调用一次 `classify()` 来分类多个条目。下面这个脚本对反馈消息排序，例如脚本中较早时某个工具返回的消息：

```js
const jev = await models.getModelOfType("classifier", "typesafe", "jev-latest");
const results = await Promise.all(
  messages.map((message) =>
    models.classify(jev, {
      state: { message },
      questions: {
        sentiment: {
          type: "choice",
          instructions: "How does the user feel about the product?",
          criteria: { positive: "Satisfied or happy", negative: "Unhappy or frustrated", neutral: "Neither" },
        },
        urgency: {
          type: "score",
          instructions: "How urgently does this need a reply?",
          criteria: ["no reply needed", "reply this week", "reply today"],
        },
      },
    }),
  ),
);
return results.map((result, i) =>
  result.stopReason === "stop"
    ? { message: messages[i], sentiment: result.answers.sentiment.choice, urgency: result.answers.urgency.score }
    : { message: messages[i], error: result.errorMessage },
);
```

`input` 包含 `"image"` 的分类器也会判断图像。`tools.read()` 会把图像文件返回为 `images` 可接受的图像块。当 `images` 非空时，其他分类器会返回错误结果。

```js
const luna = await models.getModelOfType("classifier", "openai", "gpt-6-luna");
const photo = await tools.read({ path: "screenshot.png" });
const result = await models.classify(luna, {
  state: { task: "Settings page redesign" },
  images: [photo],
  questions: {
    broken: {
      type: "bool",
      instructions: "Does the screenshot show a broken layout?",
      criteria: { true: "Overlapping, cut-off, or misaligned elements", false: "Clean layout" },
    },
  },
});
```

### 生成图像

```ts
interface ImagesContext {
  /** The prompt as text blocks, plus image blocks to edit or use as references. */
  input: (TextBlock | ImageBlock)[];
}

interface ImagesResult {
  provider: string;
  model: string;
  /** Generated images, and text blocks for models that also return text. */
  output: (TextBlock | ImageBlock)[];
  usage?: ModelUsage;
  stopReason: "stop" | "error" | "aborted";
  errorMessage?: string;
}

type TextBlock = { type: "text"; text: string };
/** `data` is base64. */
type ImageBlock = { type: "image"; data: string; mimeType: string };
```

用 `image(block)` 显示生成的图像。不要用 `text()`、`console` 或 `return` 打印 `data`：它体积很大，模型无法把它当作文本读取。`image()` 还会把每张图像保存到临时文件并把其路径放入结果，因此之后的轮次可以复制或移动该文件。

```js
// @options: {"timeout_ms": 300000}
const painter = await models.getModelOfType("image", "openrouter", "google/gemini-2.5-flash-image");
const result = await models.generateImages(painter, {
  input: [{ type: "text", text: "A red fox in the snow, watercolor" }],
});
if (result.stopReason !== "stop") return result.errorMessage;
for (const block of result.output) {
  if (block.type === "image") image(block);
  else text(block.text);
}
```

## 限制

- 脚本的 VM 有 256 MB 内存。内存耗尽会抛出 `InternalError: out of memory`；请过滤或聚合大数据，而不是累积它们。
- 在 Bun 上，停止脚本或到达其截止时间会立即结束调用，但某个不轮询 QuickJS 中断处理器的内置功能可能在其 worker 中继续计算，直到它返回。
- 在一个 pi 进程的所有会话中，最多可有两个 codemode worker 存活；`PI_CODEMODE_MAX_WORKERS` 可改变该限制。被取消的 worker 在退出之前占用其槽位。达到容量上限时，新脚本按到达顺序等待空闲 worker。60 秒内（或在其 `timeout_ms` 之前）未能获得 worker 的脚本会失败且不运行。
- 等待一个永远无法完成（没有待处理的工具调用）的 promise 的脚本会立即失败，因为没有定时器。
- 脚本不能启动其他 `codemode` 脚本。
