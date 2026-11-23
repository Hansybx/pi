> 这是简体中文译本，译自 `packages/coding-agent/docs/tui.md`。与英文原文如有出入，以原文为准。

# 终端 UI

`@earendil-works/pi-tui` 提供 Pi 使用的终端组件系统。当内置对话框、通知、状态文本和小组件不足以满足扩展所需的交互时，扩展可以使用它。

先从[扩展](../../../packages/coding-agent/docs/extensions.md#interact-with-the-user)的 `ctx.ui` 方法开始。仅当 UI 需要自己的渲染、键盘或鼠标输入、焦点、布局或生命周期时，才构建自定义组件。

## 选择集成点

| 需求 | 使用 |
|---|---|
| 选择、确认、输入或多行编辑器 | `ctx.ui.select()`、`confirm()`、`input()` 或 `editor()` |
| 非阻塞反馈 | `ctx.ui.notify()` 或 `setStatus()` |
| 编辑器附近的常驻内容 | `ctx.ui.setWidget()` |
| 替换页眉、页脚或编辑器 | 对应的 `ctx.ui` 组件工厂 |
| 临时的交互屏幕或浮层 | `ctx.ui.custom()` |
| 工具或会话条目的自定义渲染 | 扩展渲染器 |

在需要时，这些 API 会接收 Pi 的活动主题和快捷键。不要在扩展内创建第二个终端渲染器。

## 理解组件模型

组件为给定宽度渲染一组终端行。它可以选择性地处理键盘和鼠标输入，并且在其状态或依赖主题的内容变化时必须让缓存输出失效。

每一行渲染结果都必须落在给定的宽度之内。要测量可见终端列宽而不是字符串长度，因为 ANSI 转义序列、宽字符、emoji 和组合字符会改变显示宽度。

使用 `visibleWidth()`、`truncateToWidth()`、`sliceByColumn()` 和 `wrapTextWithAnsi()`，而不是自己实现终端宽度处理。Pi 会在每一行之后重置样式和超链接，因此要在每一渲染行上重新应用样式。

改变组件状态之后，让受影响的组件失效并调用注入的 `tui.requestRender()`。TUI 会合并渲染请求并更新终端。

## 组合内置组件

包中包含用于常见布局和控件的组件：

- `Text`、`Markdown`、`Image` 和 `TruncatedText` 渲染内容。
- `Container`、`VStack`、`HStack`、`Box` 和 `Spacer` 组合布局。
- `Input` 和 `Editor` 接收文本。
- `SelectList` 和 `SettingsList` 实现可搜索的选择与设置流程。
- `ScrollView` 提供有边界的可滚动视口。
- `Loader` 和 `CancellableLoader` 报告进行中的工作。
- `MouseRegion` 为另一个组件添加指针行为。

优先使用这些组件，而不是重新实现选择、滚动、文本编辑或宽度处理。扩展示例展示了如何将它们与 Pi 的边框和主题结合使用。

## 处理键盘输入和焦点

终端键盘输入使用 `matchesKey()` 和 `Key`。解析器会考虑受支持的终端协议和按键修饰符。扩展组件应针对可配置的应用操作使用注入的 `KeybindingsManager`。

显示文本光标的组件应实现 `Focusable`，并把 `CURSOR_MARKER` 紧放在其可视光标之前。用 `renderFakeCursor()` 包裹光标单元格，这样 TUI 会以反显方式绘制它，或者在显示硬件光标时在 `CURSOR_MARKER` 之后隐藏它。TUI 使用该标记为输入法定位硬件光标。

包裹 `Input` 或 `Editor` 的容器必须把自身的 `focused` 状态传递给该子组件。缺少这种传递时，中文、日文、韩文以及其他 IME 候选窗口可能出现在错误的屏幕位置。

替换主编辑器时，扩展 Pi 的 `CustomEditor`。它会保留应用快捷键和 agent 控件。

把你编辑器不拥有的按键转发给基础实现，并通过清除自定义编辑器工厂来恢复默认。

## 处理鼠标输入

全屏模式会把规范化后的鼠标事件路由到组件。处理器可以把事件标记为已处理、捕获拖拽序列、请求焦点或请求渲染。

未处理的滚轮事件会滚动最近的 `ScrollView`。未处理的主键拖拽仍可用于选择对话记录。OSC 8 链接优先于外层的点击区域。

常规模式把鼠标输入留给终端，因为终端拥有回滚缓冲区。即使全屏鼠标输入可用，也要为每种交互设计键盘路径。

## 使用自定义屏幕和浮层

`ctx.ui.custom()` 临时把交互区域的控制权交给一个组件，并在该组件调用提供的完成回调时完成（resolve）。

### 构建一个极简自定义屏幕

这个完整扩展展示了自定义组件的生命周期：在给定宽度内渲染、使用注入的快捷键、在状态变化后让缓存输出失效、请求渲染，并通过 `done()` 结束。

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("pick-target", {
    description: "Pick a deployment target",
    handler: async (_args, ctx) => {
      if (ctx.mode !== "tui") {
        ctx.ui.notify("pick-target requires interactive mode", "error");
        return;
      }

      const choices = ["development", "staging", "production"];
      const selected = await ctx.ui.custom<string | undefined>((tui, theme, keybindings, done) => {
        let selectedIndex = 0;
        let cachedWidth: number | undefined;
        let cachedLines: string[] | undefined;

        const invalidate = () => {
          cachedWidth = undefined;
          cachedLines = undefined;
        };

        return {
          render(width: number): string[] {
            if (cachedLines && cachedWidth === width) return cachedLines;

            cachedWidth = width;
            cachedLines = [
              theme.fg("accent", "Choose a deployment target"),
              ...choices.map((choice, index) => `${index === selectedIndex ? "> " : "  "}${choice}`),
              theme.fg("dim", "up/down move, enter selects, escape cancels"),
            ].map((line) => truncateToWidth(line, width));
            return cachedLines;
          },
          handleInput(data: string): void {
            if (keybindings.matches(data, "tui.select.up")) {
              selectedIndex = (selectedIndex - 1 + choices.length) % choices.length;
            } else if (keybindings.matches(data, "tui.select.down")) {
              selectedIndex = (selectedIndex + 1) % choices.length;
            } else if (keybindings.matches(data, "tui.select.confirm")) {
              done(choices[selectedIndex]);
              return;
            } else if (keybindings.matches(data, "tui.select.cancel")) {
              done(undefined);
              return;
            } else {
              return;
            }

            invalidate();
            tui.requestRender();
          },
          invalidate,
        };
      });

      if (selected) ctx.ui.notify(`Selected ${selected}`, "info");
    },
  });
}
```

该组件不显示文本光标，因此不需要 `Focusable`。包含 `Input` 或 `Editor` 的组件必须实现 `Focusable` 并把其 `focused` 值传递给该子组件。

自定义组件不会报告 pi 正在等待用户，因为 `ctx.ui.custom()` 也承载加载器和其他非阻塞 UI。当组件等待回答时，传入 `blocked: { kind: "question", message: "Pick a color" }`，这样支持[程序状态](terminal-setup.md#program-status)的终端会把 pi 显示为阻塞。`kind` 为 `"question"`、`"permission"` 或 `"auth"`。内联组件在可见期间报告阻塞：在其位置显示的更新的对话框或组件会改报自己的状态。浮层从显示时起报告阻塞，直到它调用 `done()`，包括它通过 `setHidden()` 隐藏或被另一个浮层覆盖的期间。当同时打开多个阻塞式提示时，最近显示的那个提供 `kind` 和 `message`。

传入 `overlay: true` 以绘制在现有内容之上。浮层选项控制尺寸、锚点、偏移、外边距和响应式可见性。浮层句柄可以改变焦点，或在交互仍处于活动状态时用 `setHidden()` 临时隐藏和显示该浮层。

获得焦点的浮层在普通渲染之间保持输入所有权。如果浮层仍可见时另一个组件应接收输入，请通过句柄显式释放或重定向焦点。

把每个自定义组件实例视为属于一次交互。再次开始该交互时创建新实例。

用提供给组件工厂的完成回调结束交互。它会完成（resolve）`ctx.ui.custom()` 的 promise 并释放该组件。不要对由 `ctx.ui.custom()` 创建的浮层调用 `OverlayHandle.hide()`。

定位、堆叠、焦点、响应式可见性和动画行为见 [`overlay-qa-tests.ts`](../../../packages/coding-agent/examples/extensions/overlay-qa-tests.ts)。

## 正确应用主题

使用传给扩展或组件回调的主题。主题辅助函数为强调色、弱化文本、成功、警告、错误、工具输出和 Markdown 等语义颜色生成带 ANSI 样式的字符串。

使用 `theme.style()` 把前景色和背景色与文本属性组合起来：

```typescript
return new Text(
  theme.style("Done!", {
    fg: "success",
    bg: "toolSuccessBg",
    bold: true,
  }),
  0,
  0,
);
```

样式的颜色可以是语义主题 token 或具体的 `Color`。前景 token 可作为 `fg` 接受，背景 token 可作为 `bg` 接受；要在另一个位置使用某个 token 的颜色，请传入它的具体颜色，例如 `{ fg: theme.colors.userMessageBg }`。通过 `theme.colors` 访问具体颜色，需要颜色运算时使用 `@earendil-works/pi-tui` 中的 `mixColors()` 等工具。主题设为终端默认值的 token 会用终端自身的颜色渲染；`theme.colors` 报告终端为它们声明的颜色，未声明时给出推测值。使用 `theme.appearance`（`"dark"` 或 `"light"`）来判断，例如应该提亮还是加深某个颜色。Pi 会根据终端能力把结果转换为 truecolor 或 256 色输出。主题 token 对每个主题只转换一次；尽可能在渲染路径之外计算具体颜色。

现有的 `theme.fg()` 和 `theme.bg()` 辅助函数仍可用于应用单个语义颜色。

不要永久存储带主题颜色的字符串，除非 `invalidate()` 会重建它们。主题变化会清除渲染缓存，但无法移除嵌入应用状态中的旧 ANSI 颜色。

在渲染期间求值的主题回调不需要特殊的重建。无状态组件也可以在每次渲染时计算带主题的输出。

使用[主题](themes.md)创建终端配色方案。渲染应与活动应用主题匹配的 Markdown 时，使用 Pi 的 `getMarkdownTheme()`。

## 保持渲染响应迅速

渲染运行在交互路径上。按宽度和内容缓存开销大的布局与高亮工作，然后在 `invalidate()` 中清除该缓存。

保持默认视图紧凑，通过展开或专用屏幕来展现细节。对于自定义工具渲染，要处理部分结果，并在组件可以安全更新时复用它。

诊断渲染问题时，使用 `PI_TUI_WRITE_LOG` 捕获原始 ANSI 流。测试窄宽度、宽字符、尺寸调整事件、主题变化、焦点切换，以及常规模式和全屏模式两者。

## 示例与源码

已校验的扩展示例覆盖了主要模式：

- [`preset.ts`](../../../packages/coding-agent/examples/extensions/preset.ts) 和 [`tools.ts`](../../../packages/coding-agent/examples/extensions/tools.ts) 使用选择列表和设置列表。
- [`qna.ts`](../../../packages/coding-agent/examples/extensions/qna.ts) 使用可取消的异步 UI。
- [`modal-editor.ts`](../../../packages/coding-agent/examples/extensions/modal-editor.ts) 替换编辑器。
- [`custom-footer.ts`](../../../packages/coding-agent/examples/extensions/custom-footer.ts) 替换页脚。
- [`widget-placement.ts`](../../../packages/coding-agent/examples/extensions/widget-placement.ts) 在编辑器周围放置常驻内容。
- [`doom-overlay/`](../../../packages/coding-agent/examples/extensions/doom-overlay/) 演示持续渲染的浮层。

公开导出定义在 [`packages/tui/src/index.ts`](https://github.com/earendil-works/pi/blob/main/packages/tui/src/index.ts)。扩展生命周期、状态、工具、事件和模式行为见[扩展](../../../packages/coding-agent/docs/extensions.md)。
