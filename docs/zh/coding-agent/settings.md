> 这是简体中文译本，译自 `packages/coding-agent/docs/settings.md`。与英文原文如有出入，以原文为准。

# 设置参考

本参考列出用户可配置的设置、其类型、默认值和用途。项目设置会覆盖 agent 目录设置。资源列表会合并。文件位置与信任行为见 [配置](configuration.md)。

在 `settings.json` 中加入 `"$schema": "https://pi.dev/schemas/settings.schema.json"`，以获得编辑器的校验与补全。

## 模型与思考

<a id="model-cycling"></a>

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `defaultProvider` | string | 自动 | 启动时的 AI provider。 |
| `defaultModel` | string | 自动 | 启动模型 ID。 |
| `defaultThinkingLevel` | `"off" \| "minimal" \| "low" \| "medium" \| "high" \| "xhigh" \| "max"` | `"medium"` | 启动时的思考级别。 |
| `modelThinkingLevels` | object | 无 | 按精确的 `provider/modelId` 指定的每模型启动思考级别。 |
| `thinkingBudgets` | object | 内置预算 | `minimal`、`low`、`medium` 和 `high` 思考级别的 token 预算。 |
| `enabledModels` | `string[]` | 所有可用模型 | 用于启动选择与模型循环的模型模式。格式与 `--models` 相同。 |
| `hideThinkingBlock` | boolean | `false` | 在记录中隐藏思考块。 |
| `showCacheMissNotices` | boolean | `false` | 为明显的缓存未命中、成功的缓存预热、压缩使用以及 provider 恢复显示提示。 |
| `cacheWarming` | `"off" \| "streaming" \| "idle"` | `"idle"` | 在活动运行期间保持符合条件的 provider 提示缓存预热；使用 `"idle"` 时，在运行之间最多保持 30 分钟。`"streaming"` 仅在活动运行期间预热。仅限全局设置。 |

仅当模型声明了缓存生存时间，且 Pi 估计至少可避免 $0.05 的缓存未命中成本时，才会执行缓存预热。刷新产生的用量会计入会话总计，但不进入模型上下文。`/session` 会显示下一次决策；扩展可用 `cache_warming_decision` 覆盖它。见 [提示缓存生存时间](models.md#prompt-cache-lifetimes)。

模型选择与思考控制见 [选择模型](models.md)。

## 交互

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `steeringMode` | `"all" \| "one-at-a-time"` | `"one-at-a-time"` | 队列中的引导消息如何投递。 |
| `followUpMode` | `"all" \| "one-at-a-time"` | `"one-at-a-time"` | 队列中的后续消息如何投递。 |
| `externalEditor` | string | `$VISUAL`、`$EDITOR`，然后是平台默认 | 由外部编辑器快捷键打开的命令。 |
| `doubleEscapeAction` | `"tree" \| "fork" \| "none"` | `"tree"` | 编辑器为空时连按两次 Escape 的动作。 |
| `treeFilterMode` | `"default" \| "no-tools" \| "user-only" \| "labeled-only" \| "all"` | `"default"` | `/tree` 使用的初始过滤器。 |
| `defaultProjectTrust` | `"ask" \| "always" \| "never"` | `"ask"` | 回退的项目信任行为。**只能在 agent 目录设置中设置。** |

## 工具

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `defaultTools` | `string[]` | `read`、`bash`、`edit`、`write` | 启动时启用的工具。纯名称会替换默认值；`+name` 添加工具，`-name` 移除工具。空数组会禁用所有内置工具，但不会禁用扩展或 SDK 工具。 |
| `codemode.mode` | `"on"` \| `"only"` | `"on"` | `codemode` 工具在活动时如何呈现工具。`on`：已声明的工具会在其描述后追加一段关于从脚本调用它们的说明，并且 `codemode` 只列出未声明的工具。`only`：`codemode` 列出脚本可调用的所有工具，活动的内置工具和扩展工具对模型隐藏，因此模型通过 `codemode` 访问它们。 |
| `codemode.inlineBudget` | number | `3000` | `codemode` 工具的描述中可用于工具声明的估算 token 数（字符 / 4）。放不下的工具会被略过，可通过 `searchTools()` 找到。`0` 只列出命名空间。 |

可用的内置工具包括 `read`、`bash`、`powershell`、`edit`、`write`、`grep`、`find` 和 `ls`。`defaultTools` 也可以指定 `codemode` 和 `tool_search`（内置扩展以未激活状态注册它们），以及其他以未激活状态注册的扩展工具。

仅含 `+name` 和 `-name` 条目的列表会改变继承的选择，而不是替换它。例如，下面这段会在默认工具之外启用 `codemode`：

```json
{
  "defaultTools": ["+codemode"]
}
```

下面这段用 `powershell` 替换 `bash` 并启用 `grep`：`["-bash", "+powershell", "+grep"]`。项目设置会在用户设置之上生效：仅含 `+name` 和 `-name` 条目的项目列表会改变用户的选择，而含纯名称的项目列表会替换它。在同一个列表中，纯名称构成选择，然后 `+name` 和 `-name` 依次生效。

`/reload` 会启用新加入 `defaultTools` 的工具。它不会禁用从其中移除的工具，也不会重新启用你关闭过且未改动的工具。带纯名称的 `--tools`、`--no-tools` 和 `--no-builtin-tools` 会覆盖 `defaultTools`，重载时也是如此。

CLI 工具选项会在单次调用中覆盖此设置。仅含 `+name` 和 `-name` 条目的 `--tools` 则改变解析后的 `defaultTools` 选择，例如 `pi --tools +codemode`。在 `/reload` 时，这些条目也会作用于重载后的设置，因此用 `-name` 移除的工具会保持移除状态。见 [命令行](cli.md#tools)。

## 会话与上下文

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `sessionDir` | string | agent 会话目录 | 会话存储目录。相对路径从工作目录解析。`PI_CODING_AGENT_SESSION_DIR` 和 `--session-dir` 会覆盖此设置。 |
| `sessionShareDestination` | `"auto" \| "gist" \| "radius"` | `"auto"` | `/share` 使用的目标。`auto` 在已认证时使用 Radius，否则创建 GitHub gist。`gist` 始终使用 gist。`radius` 需要 Radius 认证，且从不回退到 gist。 |

### 压缩（compaction）

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `compaction.enabled` | boolean | `true` | 启用自动压缩。 |
| `compaction.reserveTokens` | number | `16384` | 剩余上下文 token 低于该值时启动自动压缩。 |
| `compaction.keepRecentTokens` | number | `20000` | 不做摘要而保留的近期 token。 |
| `compaction.modelOverrides` | object | 无 | 按精确的 `provider/modelId` 指定的每模型 token 设置。 |

<a id="per-model-compaction-overrides"></a>

压缩 token 值必须是非负安全整数。每个值独立解析：先匹配对应的模型覆盖，然后是普通压缩设置，最后是内置默认值。项目对象与用户对象会在查找模型之前合并。

触发、摘要与校验行为见 [压缩参考](compaction.md)。

### 分支摘要

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `branchSummary.reserveTokens` | number | `16384` | 汇总分支历史时预留的 token。 |
| `branchSummary.skipPrompt` | boolean | `false` | 跳过分支摘要提示，默认不生成摘要。 |

## 终端与显示

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `theme` | string | `"system"` | 内置或自定义主题名称。`system` 从终端主题推导颜色。 |
| `quietStartup` | boolean \| `"header"` | `false` | `true` 隐藏启动标题和已加载资源列表。`"header"` 保留标题（版本与按键提示）但隐藏模型范围行和已加载资源列表。 |
| `tuiMode` | `"regular" \| "fullscreen"` | `"fullscreen"` | 交互式终端 UI 模式。 |
| `fullscreenExitOutput` | `"transcript" \| "resume-hint"` | `"transcript"` | 全屏模式退出时打印的输出。 |
| `fullscreenScrollbar` | `"auto" \| "always" \| "hidden"` | `"auto"` | 全屏记录滚动条行为。 |
| `fullscreenCopyOnSelect` | boolean | `true` | 在全屏模式下自动复制选中的文本。 |
| `fullscreenWheelScrollLines` | `"auto"` \| number | `"auto"` | 全屏模式下每次鼠标滚轮事件的行数，从 1 到 100。`"auto"` 在本地 macOS 终端中每个事件移动一行，因为这类终端本身已对滚轮和触控板输入做了加速；在其他环境以及通过 SSH 时，它会把快速滚轮的转动加速到每个事件最多 6 行。Alt+滚轮移动的距离是五倍。 |
| `editorPaddingX` | number | `0` | 编辑器水平内边距，从 0 到 3 个单元格。 |
| `outputPad` | `0 \| 1` | `1` | 消息、工具输出、`!` 命令输出和摘要块的水平记录内边距。 |
| `autocompleteMaxVisible` | number | `5` | 可见的自动补全条目数，从 3 到 20。 |
| `showHardwareCursor` | boolean | `false` | 使用终端光标而不是 Pi 绘制的光标。Pi 仍会为输入法定位它。 |
| `terminal.showImages` | boolean | `true` | 在支持时显示内联图片。 |
| `terminal.imageWidthCells` | number | `60` | 首选的终端单元格内联图片宽度。 |
| `terminal.clearOnShrink` | boolean | `false` | 渲染内容收缩时清除空行。未设置时，`PI_CLEAR_ON_SHRINK=1` 会启用它。 |
| `terminal.showTerminalProgress` | boolean | `false` | 在终端标签页中显示 OSC 9;4 进度。 |
| `terminal.hyperlinks` | `boolean \| "auto"` | `"auto"` | 覆盖 OSC 8 超链接检测。 |
| `terminal.images` | `"kitty" \| "iterm2" \| "auto" \| false` | `"auto"` | 覆盖内联图片协议检测。 |
| `terminal.trueColor` | `boolean \| "auto"` | `"auto"` | 覆盖真彩色检测。 |
| `images.autoResize` | boolean | `true` | 发送给模型之前将图片调整为最大 2000 x 2000 像素。 |
| `images.blockImages` | boolean | `false` | 阻止图片发送给模型。 |
| `markdown.codeBlockIndent` | string | `"  "` | 用于缩进渲染代码块的前缀。 |
| `markdown.mermaid` | `"off" \| "final" \| "streaming"` | `"streaming"` | Mermaid 渲染模式。 |

格式与平台细节见 [主题](themes.md) 和 [终端设置](terminal-setup.md)。

## 网络与重试

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `transport` | `"auto" \| "sse" \| "websocket" \| "websocket-cached"` | `"auto"` | 对支持多种传输方式的 AI provider 首选的传输方式。 |
| `httpProxy` | string | 无 | 作为 `HTTP_PROXY` 和 `HTTPS_PROXY` 应用于 Pi 管理的 HTTP 客户端的代理 URL。**只能在 agent 目录设置中设置。** |
| `httpIdleTimeoutMs` | number \| `"disabled"` | `300000` | HTTP 标头与正文的空闲超时（毫秒）。设置为 `0` 或 `"disabled"` 可禁用。 |
| `websocketConnectTimeoutMs` | number \| `"disabled"` | `15000` | WebSocket 连接超时（毫秒）。设置为 `0` 或 `"disabled"` 可禁用。 |
| `retry.enabled` | boolean | `true` | 为瞬时故障启用 agent 级自动重试。 |
| `retry.maxRetries` | number | `3` | agent 级重试的最大次数。 |
| `retry.baseDelayMs` | number | `2000` | 初始指数退避延迟（毫秒）。 |
| `retry.maxAgentDelayMs` | number | `60000` | agent 级重试延迟上限（毫秒）。 |
| `retry.provider.timeoutMs` | number | `httpIdleTimeoutMs` | provider 请求超时（毫秒）。 |
| `retry.provider.maxRetries` | number | `0` | provider 级重试次数。 |
| `retry.provider.maxRetryDelayMs` | number | `60000` | 服务器请求的延迟上限（毫秒）。设置为 `0` 可取消该限制。 |

除非需要 provider 级重试，否则请将 `retry.provider.maxRetries` 保持为 `0`。provider 重试会拖慢 Pi 自行处理配额与用量上限错误。

## Shell

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `shellPath` | string | 平台默认 | 自定义 shell 可执行文件路径。支持前导 `~`。 |
| `shellCommandPrefix` | string | 无 | 加到每条 shell 命令前面的前缀。 |
| `npmCommand` | `string[]` | `npm` | 用于 npm 包查找与安装的命令和参数。 |
| `selfUpdateCommand` | `string[]` | 无 | `pi update` 用于更新 Pi 自身的命令和参数，支持 `{packageName}`、`{version}` 和 `{installSpec}` 占位符。`PI_SELF_UPDATE_COMMAND` 优先。**只能在 agent 目录设置中设置。** 见 [自定义更新命令](cli.md#custom-update-command)。 |

shell 设置见 [Shell 别名](shell-aliases.md)，包管理器行为见 [Pi 包](packages.md)。

## 资源

用户设置中的资源路径从 agent 目录解析。项目设置中的路径从项目的 `.pi` 目录解析。支持绝对路径和 `~`。

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `packages` | array | `[]` | npm、git 或本地 Pi 包来源。见 [Pi 包](packages.md)。 |
| `extensions` | `string[]` | `[]` | 扩展文件或目录。 |
| `skills` | `string[]` | `[]` | 技能文件或目录。 |
| `prompts` | `string[]` | `[]` | 提示模板文件或目录。 |
| `themes` | `string[]` | `[]` | 主题文件或目录。 |
| `enableSkillCommands` | boolean | `true` | 将技能注册为 `/skill:name` 命令。 |

资源数组支持用 `!pattern` 做 glob 排除、用 `+path` 精确包含、用 `-path` 精确排除。Pi 会加载用户级和项目设置中列出的资源。

内置扩展在 `extensions` 中的名称为 `builtin:mcp`、`builtin:llama.cpp`、`builtin:codemode` 和 `builtin:tool-search`。它们默认加载；`-builtin:mcp` 可禁用其中一个。项目设置中的 `+builtin:<name>` 或 `-builtin:<name>` 条目会覆盖用户设置。`pi config` 会在 Built-in 下列出它们。`--no-extensions` 也会禁用它们，`-e builtin:<name>` 可显式加载其中一个。

## 更新、遥测与警告

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `collapseChangelog` | boolean | `false` | 更新后显示精简的变更日志。也会将扩展包的变更日志精简为每个包一行。 |
| `enableInstallTelemetry` | boolean | `true` | 启用匿名安装/更新上报以及选定的 provider 归属标头。不控制更新检查。 |
| `enableAnalytics` | boolean | `false` | 选择加入分析数据共享。目前仅由实验性的首次运行设置使用。 |
| `warnings.anthropicExtraUsage` | boolean | `true` | 当 Anthropic 订阅认证可能使用付费额外用量时发出警告。 |