> 这是简体中文译本，译自 `packages/coding-agent/docs/virtual-models.md`。与英文原文如有出入，以原文为准。

# 虚拟模型

虚拟模型是一种可选择的模型，它会为每个请求挑选一个物理模型。可以用它按任务、成本或对话状态来路由。例如，路由器可以把简单的问题发给小模型、把难题发给大模型，而用户只选择一个模型。

从[扩展](../../../packages/coding-agent/docs/extensions.md)注册虚拟模型。它们会像其他任何模型一样出现在 `/model`、`--model`、scoped models 和设置中。虚拟模型可以列在任意 provider 下，包括带物理模型的 provider，例如 `openai-codex/auto`。

## 选择与派发

虚拟模型会选择模型和思考等级。路由器为每个请求把这一组合映射到物理模型的组合：

```
selected (virtual model, virtual level)  ->  dispatched (physical model, physical level)
jev/auto:low                             ->  anthropic/claude-sonnet-4-5:high
```

虚拟思考等级是路由器的输入。它的含义由路由器决定；它不必对应某个推理预算。

Pi 会把这两组组合区分开：

| | 选择 | 派发 |
|---|---|---|
| 记录位置 | `model_change` 和 `thinking_level_change` 条目 | 每条 assistant 消息：`provider`、`api`、`model`、`thinkingLevel` |
| 可见形式 | `ctx.model`、`ctx.thinkingLevel`、`PI_MODEL`、`PI_REASONING_LEVEL`、`/model` | 每次响应对应的 assistant 消息 |

provider 只会收到物理模型。assistant 消息会指明物理模型，因此跨不同物理模型重放对话与手动切换模型之后的效果相同。恢复会话时会从最新的 `model_change` 条目恢复虚拟选择。如果该虚拟模型已不再注册，Pi 会回退到最近作答的物理模型。

在交互模式下，页脚会在所选内容旁显示路由到的模型，例如 `auto • high → gpt-5.6-luna • medium`。`/session` 会列出每个物理模型的成本。

上下文用量使用产生最近一次响应的物理模型的限制，即使该响应发生在切换到虚拟模型之前。如果没有这样的响应，则使用虚拟模型上声明的限制（若有）。压缩（compaction）会检查相同的限制，并还会检查每个请求被路由到的模型的限制。如果该模型的上下文窗口对这段对话来说太小，Pi 会在发送请求之前进行压缩；路由仍保持路由器选择的结果。

## 注册虚拟模型

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerVirtualModel({
    provider: "router",
    id: "auto",
    name: "Auto",
    thinkingLevels: ["low", "high"],
    route(request, ctx) {
      // Tool follow-ups and retries stay on the model that handled the turn.
      const sticky = request.failed ?? request.previous;
      if (request.reason !== "user" && sticky) {
        return { model: sticky.model, thinkingLevel: sticky.thinkingLevel ?? "medium" };
      }
      const id = request.thinkingLevel === "high" ? "claude-sonnet-4-5" : "claude-haiku-4-5";
      return { model: ctx.modelRegistry.find("anthropic", id)!, thinkingLevel: "medium" };
    },
  });
}
```

- `provider` 是该模型列在哪个 provider 下。它可以是任意 provider ID。一个 provider 可以在其物理模型旁边列出多个虚拟模型。在物理 provider 下，只有当该 provider 具有凭证时虚拟模型才可用。在没有任何 provider 使用的 ID 下，它始终可用。
- `id` 不能是该 provider 某个物理模型的 ID。如果之后目录刷新添加了相同 ID 的物理模型，虚拟模型会将它隐藏。
- `thinkingLevels` 列出可供选择的等级。默认为 `["off"]`。
- `contextWindow` 和 `maxTokens` 会在第一次响应之前显示。未设置的限制视为未知。
- `input` 列出可供选择的输入类型。默认为文本和图像；不支持图像的物理模型会收到占位符。

注册遵循与 `pi.registerProvider()` 相同的排队和重载规则。再次注册相同的 provider 和 ID 会替换该虚拟模型。`pi.unregisterVirtualModel(provider, id)` 会移除它；`pi.unregisterProvider()` 不会。SDK 代码可以在没有扩展的情况下注册：`modelRuntime.registerVirtualModel(definition)`。

## 路由请求

`route(request, ctx)` 在使用该虚拟模型的每个请求之前运行，并返回 `{ model, thinkingLevel }`。模型可以是目录中任意一个其 provider 具有凭证的物理模型；用 `ctx.modelRegistry` 查找它。虚拟模型不能路由到另一个虚拟模型。Pi 会把思考等级限制为返回模型所支持的等级。

| 字段 | 含义 |
|---|---|
| `model`、`thinkingLevel` | 选中的虚拟模型和等级 |
| `reason` | 发起请求的原因，见下文 |
| `previous` | `messages` 中最近一次成功响应的物理模型和思考等级 |
| `failed` | 对于 `retry`：失败请求的物理模型、思考等级和 assistant `message`，该消息已不再包含在 `messages` 中。该消息带有 `stopReason` 和 `errorMessage`。当路由本身失败时不存在 |
| `state` | 此会话分支上最近返回的路由器状态，见下文 |
| `messages` | 此请求的对话内容，包括系统消息 |
| `signal` | 该请求的中止信号 |

| `reason` | 请求 |
|---|---|
| `user` | 用户写下消息后的第一个请求，包括引导消息和后续消息 |
| `continuation` | agent 循环中的任何其他请求，例如工具结果或扩展消息之后的请求 |
| `retry` | 请求失败后的自动重试，包括因上下文溢出而压缩之后 |
| `direct` | 在 agent 循环之外发起的请求，例如压缩摘要，或扩展调用 `ctx.modelRegistry.streamSimple()` |

为 `continuation` 返回 `previous`、为 `retry` 返回 `failed` 可以让提示缓存和思考签名保持有效。允许在轮次之间切换模型，但会丢失提示缓存。重试也可以切换到另一个模型，例如当 `failed.message.errorMessage` 报告某个 provider 过载或上下文溢出时。

如果 `route()` 抛出异常，或者返回了虚拟模型或没有凭证的模型，请求会以错误响应结束。

## 保留路由状态

`route()` 可以在模型之外同时返回 `state`。Pi 把它存储在会话分支上，并在后续请求中作为 `request.state` 传回。用它来记录对话记录中没有记录的决定，例如分类器结果或路由阶段：

```typescript
pi.registerVirtualModel<{ phase: "plan" | "build" }>({
  provider: "router",
  id: "phased",
  name: "Phased",
  route(request, ctx) {
    const state = request.state ?? { phase: "plan" };
    const id = state.phase === "plan" ? "claude-opus-4-5" : "claude-haiku-4-5";
    return { model: ctx.modelRegistry.find("anthropic", id)!, thinkingLevel: "medium", state };
  },
});
```

- 状态必须可 JSON 序列化。返回 `undefined` 或 `request.state` 本身会保持当前状态。
- Pi 会在请求发送之前把任何其他返回对象作为新状态存储，即使它与当前状态相同。只在状态变化时返回新对象。如果请求之后失败，该状态仍会保留。
- 状态跟随会话树，因此 fork 和 `/tree` 导航会看到其所在分支的状态。它能在压缩（compaction）后保留。
- `direct` 请求没有状态，Pi 会忽略它们返回的状态。

对话记录已经记录了所选内容和每个派发的模型，`ctx.sessionManager.getBranch()` 会同时暴露两者。

路由器可以通过 `ctx.modelRegistry` 调用其他模型，例如用来自 `ctx.modelRegistry.findOfType("classifier", provider, id)` 的分类器模型调用 `ctx.modelRegistry.classify()`。该调用会在该轮次的第一个 token 之前增加延迟。

完整的路由器示例见 [`jev-router.ts`](../../../packages/coding-agent/examples/extensions/jev-router.ts)。它用 Jev 分类器选出的强大 OpenAI Codex 模型做规划，让该模型完成第一次编辑，然后切换一次到更便宜的模型，并接受一次提示缓存未命中。它把阶段保留为路由器状态。
