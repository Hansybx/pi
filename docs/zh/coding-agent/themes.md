> 这是简体中文译本，译自 `packages/coding-agent/docs/themes.md`。与英文原文如有出入，以原文为准。

# 用主题自定义 Pi

主题控制 Pi 在交互模式和 HTML 导出中使用的颜色。Pi 内置 `system`、`dark` 和 `light` 主题。你可以选择一个主题、跟随终端的浅色或深色外观，或创建自己的调色板。

## 使用终端自带的颜色

`system` 主题是默认主题。它根据终端主题构建 Pi 的颜色，因此 Pi 与终端匹配，而不是自带一套调色板：

- Pi 查询终端的默认前景色和背景色及其 16 个 ANSI 颜色。
- 每个 Pi 颜色的色相取自某个 ANSI 颜色，例如错误取自红色，链接取自蓝色。
- Pi 会设置每个颜色的明度，使其与背景保持最小对比度。正文在背景和每个面板上都至少保持 4.5:1 的 WCAG 对比度。
- 当终端在浅色和深色之间切换时，Pi 会重新查询颜色并重建主题。

主题会适配终端上报的信息：

| 终端上报 | 结果 |
|---|---|
| 背景色和 ANSI 颜色 | 使用终端调色板中的颜色，并按实际背景放置。 |
| 仅背景色 | 使用 Pi 自己的色相，并按实际背景放置。 |
| 无 | 使用 ANSI 颜色索引和终端默认颜色，由终端自行渲染。次要文本为淡色，面板没有背景色。 |

Pi 在启动时向终端查询颜色。终端通常会在几毫秒内回答，Pi 最多等待 100 ms 就显示启动标题。如果终端没有及时回答，Pi 会使用 ANSI 颜色回退，并且在颜色稍后到达时（例如通过缓慢的 SSH 连接）仍会应用它们。`system` 是保留名称：使用该名称的自定义主题会被忽略。

<a id="selecting-a-theme"></a>

## 选择主题

打开 `/settings` 并选择 **Theme**。你可以为所有终端外观使用同一个主题，或为浅色和深色终端分别选择主题。

选择结果会保存为 `theme` [设置](settings.md#terminal-and-display)：

```json
{
  "theme": "dark"
}
```

没有 `theme` 设置时，Pi 使用 `system`。

自动模式先存浅色主题，再存深色主题：

```json
{
  "theme": "light/dark"
}
```

Pi 根据上报的背景色和前景色判断终端是浅色还是深色。如果终端没有上报背景色，Pi 会依次使用终端的浅色/深色通知、`COLORFGBG` 环境变量，最后是深色。同一判断用于选择浅色/深色主题对中的主题以及 `system` 的外观。启用自动模式时，Pi 会在终端上报外观变化时切换主题。主题名称不能包含 `/`，因为 Pi 将该格式保留给此设置。

使用 `--use-theme` 为单次调用选择初始主题，而不更改已保存的设置：

```bash
pi --use-theme light
pi --use-theme light/dark
```

命令行选项见 [CLI 资源](cli.md#resources)。

## 创建自定义主题

复制某个[内置主题](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/src/modes/interactive/theme)，或创建一个符合 [schema](https://pi.dev/schemas/theme.schema.json) 的新 JSON 文件。内置主题使用 OKHSL 颜色，并为多个角色共用的颜色定义变量，因此你可以直接调整色相、饱和度或明度。

1. 将文件保存为 `<agent-dir>/themes/my-theme.json`。agent 目录默认为 `~/.pi/agent`。
2. 将其 `name` 设为 `my-theme`。
3. 修改 `vars` 和 `colors` 中的值。
4. 通过 `/settings` 选择 `my-theme`。

用主题名称作为文件名。Pi 只会从 `<agent-dir>/themes/<name>.json` 热重载当前用户主题。从其他任何来源添加或更改主题后，请运行 `/reload`。

## 了解主题文件

| 属性 | 必需 | 作用 |
|---|---|---|
| `$schema` | 否 | 依据 Pi 发布的 schema 启用编辑器校验与补全。 |
| `name` | 是 | 在选择器和设置中标识主题。它必须唯一，不能包含 `/`，也不能为 `system`。 |
| `appearance` | 否 | `"dark"` 或 `"light"`：主题所针对的背景。省略时 Pi 会从主题颜色推断。 |
| `vars` | 否 | 定义可复用的颜色值。变量可以引用其他变量。 |
| `colors` | 是 | 为终端 UI 角色分配颜色。schema 中标识了必需和可选的角色。 |
| `export` | 否 | 覆盖 HTML 导出中的页面和面板背景。 |

主题对象是严格的：只接受已文档化的顶层字段和颜色 token。在 `vars` 下定义可复用的自定义颜色；`colors` 或 `export` 下的自定义键以及额外的顶层元数据都会被拒绝。

颜色可以用六种形式书写：

| 形式 | 示例 | 含义 |
|---|---|---|
| RGB 十六进制 | `"#0af"` 或 `"#00aaff"` | 三位或六位的 sRGB 颜色。 |
| OKLCH | `"oklch(62% 0.1 200)"` | 感知明度、色度和色相。 |
| OKHSL | `"okhsl(250 60% 55%)"` | 色相、饱和度和明度。饱和度相对于该色相与明度下 sRGB 色域所允许的最大值，因此每个值都在色域内，且相同的饱和度看起来同样鲜艳。 |
| 256 色索引 | `39` | 从 `0` 到 `255` 的 ANSI 调色板索引。 |
| 变量引用 | `"primary"` | `vars` 中某个条目的值。 |
| 终端默认色 | `""` | 终端的默认前景色或背景色。 |

终端默认色会渲染为终端自身的颜色。在 Pi 需要具体值的场合（例如 HTML 导出或扩展的颜色计算），它会使用终端上报的默认颜色，或根据主题外观猜测的黑色或白色。

Pi 会解析链式的变量引用。缺失的变量或循环引用会使主题无效。Pi 在可用时使用真彩色，将 OKLCH 映射到 sRGB 色域，并为 256 色终端近似颜色。HTML 导出会将 OKHSL 值转换为十六进制，因为 CSS 不支持它们。如果颜色与其源值不同，请检查终端的真彩色检测和对比度设置。见 [配置终端](terminal-setup.md#override-detected-capabilities)。

使用[主题 JSON schema](https://pi.dev/schemas/theme.schema.json) 了解确切的属性、必需的颜色和可接受的值类型。

Pi 会在启动和 `/reload` 期间报告无效的主题文件。

## 找到要修改的颜色

主题颜色描述的是界面角色而不是单个组件。可以用下面这些分组在 schema 中找到相关部分：

| 区域 | 颜色名称 |
|---|---|
| 通用界面 | `accent`、`border*`、`text`、`muted`、`dim`、`success`、`error`、`warning` |
| 选择与全屏 | `selectedBg`、`searchMatch*`、`scrollbar*` |
| 消息 | `userMessage*`、`customMessage*`、`thinkingText` |
| 工具执行 | `toolPendingBg`、`toolSuccessBg`、`toolErrorBg`、`toolTitle`、`toolOutput` |
| Markdown | `md*` |
| 工具 diff | `toolDiff*` |
| 语法高亮 | `syntax*` |
| 编辑器模式 | `thinking*`、`bashMode` |
| HTML 导出 | `export.pageBg`、`export.cardBg`、`export.infoBg` |

schema 是格式参考。内置主题提供了完整的值，你可以复制并调整。

有五个颜色是可选的，省略时会继承另一个颜色：

| 可选颜色 | 回退 |
|---|---|
| `scrollbarTrack` | `muted` |
| `scrollbarThumb` | `text` |
| `searchMatchBg` | `selectedBg` |
| `searchMatchText` | `text` |
| `thinkingMax` | `thinkingXhigh` |

如果省略 `export` 颜色，Pi 会从 `userMessageBg` 派生 HTML 页面和面板背景。

## 从项目或包加载主题

将项目主题放在 `.pi/themes/` 中。只有在授予[项目信任](security.md#understand-project-trust)之后，项目主题才会加载。

你也可以通过 `themes` 设置加载主题文件和目录，或将它们分发到 Pi 包中。见 [配置](configuration.md)、[设置](settings.md#resources) 和 [Pi 包](packages.md)。

每个加载的主题都必须有唯一的名称。Pi 会将重名报告为资源冲突。