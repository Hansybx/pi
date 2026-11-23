> 这是简体中文译本，译自 `packages/coding-agent/docs/rpc-extension-ui.md`。与英文原文如有出入，以原文为准。

# RPC 扩展 UI

扩展可以通过 `ctx.ui` 请求用户交互。在 RPC 模式下，受支持的调用会成为一种请求/响应子协议，与常规的 [RPC 命令](rpc-commands.md) 和[会话事件](json.md) 并存。

扩展 UI 方法分为两类：

- **对话框方法**（`select`、`confirm`、`input`、`editor`）：在 stdout 上发出 `extension_ui_request`，并阻塞等待客户端在 stdin 送回 `id` 匹配的 `extension_ui_response`。
- **即发即弃方法**（`notify`、`setStatus`、`setWidget`、`setTitle`、`set_editor_text`）：在 stdout 上发出 `extension_ui_request`，但不期待响应。客户端可以展示这些信息，也可以忽略。

如果对话框方法带有 `timeout` 字段，超时后 agent 一侧会用默认值自动完成解析。客户端不需要自行跟踪超时。

## 限制

有些 `ExtensionUIContext` 方法在 RPC 模式下不受支持或被降级，因为它们需要直接访问终端 UI：

- `custom()` 返回 `undefined`。
- `onTerminalInput()` 返回一个空的取消订阅函数。
- `setWorkingMessage()`、`setWorkingVisible()`、`setWorkingIndicator()`、`setHiddenThinkingLabel()`、`setFooter()`、`setHeader()`、`addAutocompleteProvider()`、`setEditorComponent()` 和 `setToolsExpanded()` 均为空操作。
- `getEditorText()` 返回 `""`，`getEditorComponent()` 返回 `undefined`。
- `getToolsExpanded()` 返回 `false`。
- `pasteToEditor()` 委托给 `setEditorText()`，不做终端粘贴处理。
- `getAllThemes()` 返回 `[]`，`getTheme()` 返回 `undefined`。
- `setTheme()` 返回 `{ success: false, error: "Theme switching not supported in RPC mode" }`。

注意：在 RPC 模式下，`ctx.mode` 为 `"rpc"`，`ctx.hasUI` 为 `true`，因为对话框方法和即发即弃方法可以通过扩展 UI 子协议正常工作。要守护像 `custom()` 这类依赖真实终端的 TUI 专属功能，请使用 `ctx.mode === "tui"`。

## Pi 发出的请求

所有请求都有 `type: "extension_ui_request"`、唯一的 `id` 以及 `method` 字段。

### select

提示用户从列表中选择一项。带 `timeout` 字段的对话框方法会包含以毫秒为单位的超时时间；如果客户端未及时响应，agent 会用 `undefined` 自动完成解析。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-1",
  "method": "select",
  "title": "Allow dangerous command?",
  "options": ["Allow", "Block"],
  "timeout": 10000
}
```

期望的响应：带 `value`（所选选项字符串）或 `cancelled: true` 的 `extension_ui_response`。

### confirm

提示用户进行是/否确认。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-2",
  "method": "confirm",
  "title": "Clear session?",
  "message": "All messages will be lost.",
  "timeout": 5000
}
```

期望的响应：带 `confirmed: true/false` 或 `cancelled: true` 的 `extension_ui_response`。

### input

提示用户输入自由格式文本。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-3",
  "method": "input",
  "title": "Enter a value",
  "placeholder": "type something..."
}
```

期望的响应：带 `value`（输入的文本）或 `cancelled: true` 的 `extension_ui_response`。

### editor

打开多行文本编辑器，可预填内容。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-4",
  "method": "editor",
  "title": "Edit some text",
  "prefill": "Line 1\nLine 2\nLine 3"
}
```

期望的响应：带 `value`（编辑后的文本）或 `cancelled: true` 的 `extension_ui_response`。

### notify

显示一条通知。即发即弃，不期待响应。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-5",
  "method": "notify",
  "message": "Command blocked by user",
  "notifyType": "warning"
}
```

`notifyType` 字段为 `"info"`、`"warning"` 或 `"error"`。省略时默认为 `"info"`。

### setStatus

设置或清除页脚/状态栏中的一条状态项。即发即弃。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-6",
  "method": "setStatus",
  "statusKey": "my-ext",
  "statusText": "Turn 3 running..."
}
```

发送 `statusText: undefined`（或省略该字段）即可清除该键对应的状态项。

### setWidget

设置或清除显示在编辑器上方或下方的 widget（一组文本行）。即发即弃。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-7",
  "method": "setWidget",
  "widgetKey": "my-ext",
  "widgetLines": ["--- My Widget ---", "Line 1", "Line 2"],
  "widgetPlacement": "aboveEditor"
}
```

发送 `widgetLines: undefined`（或省略该字段）即可清除该 widget。`widgetPlacement` 字段为 `"aboveEditor"`（默认）或 `"belowEditor"`。RPC 模式只支持字符串数组；组件工厂会被忽略。

### setTitle

设置终端窗口/标签页标题。即发即弃。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-8",
  "method": "setTitle",
  "title": "pi - my project"
}
```

### set_editor_text

设置输入编辑器中的文本。即发即弃。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-9",
  "method": "set_editor_text",
  "text": "prefilled text for the user"
}
```

## 发往 Pi 的响应

只有对话框方法（`select`、`confirm`、`input`、`editor`）需要发送响应。`id` 必须与请求匹配。

### 取值响应（select、input、editor）

```json
{"type": "extension_ui_response", "id": "uuid-1", "value": "Allow"}
```

### 确认响应（confirm）

```json
{"type": "extension_ui_response", "id": "uuid-2", "confirmed": true}
```

### 取消响应（任意对话框）

关闭任意对话框方法。扩展会收到 `undefined`（对 select/input/editor）或 `false`（对 confirm）。

```json
{"type": "extension_ui_response", "id": "uuid-3", "cancelled": true}
```

## 示例

参见已纳入版本库的 [RPC 扩展 UI 客户端](../../../packages/coding-agent/examples/rpc-extension-ui.ts) 及其[演示扩展](../../../packages/coding-agent/examples/extensions/rpc-demo.ts)。

导出的请求与响应联合类型定义在 [`rpc-types.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/rpc/rpc-types.ts) 中。与模式无关的扩展指南见[扩展](../../../packages/coding-agent/docs/extensions.md#ui-and-modes)。
