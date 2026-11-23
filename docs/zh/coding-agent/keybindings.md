> 这是简体中文译本，译自 `packages/coding-agent/docs/keybindings.md`。与英文原文如有出入，以原文为准。

# 快捷键参考

Pi 暴露具名动作，例如 `app.session.new`，可以为它们分配快捷键。你可以在 Pi 的[用户配置](configuration.md#agent-directory)中更改默认分配，或为未分配的动作绑定快捷键。

运行 `/hotkeys` 查看主编辑器和应用中当前生效的快捷键。

## 分配快捷键

创建 `<agent-dir>/keybindings.json`。agent 目录默认为 `~/.pi/agent`，详见 [agent 目录](configuration.md#agent-directory)。

将每个动作标识符映射到一个按键或一个按键列表：

```json
{
  "$schema": "https://pi.dev/schemas/keybindings.schema.json",
  "app.session.new": "ctrl+shift+n",
  "app.session.tree": ["ctrl+shift+t", "alt+shift+t"]
}
```

配置的值会替换该动作的默认值。使用空列表可禁用某个动作的快捷键：

```json
{
  "tui.altScreen.pageUp": []
}
```

编辑该文件后，运行 `/reload` 将改动应用到当前会话。

## 按键语法

按键写作 `modifier+key`。修饰键为 `ctrl`、`shift`、`alt` 和 `super`。可以组合多个修饰键。有效的按键包括：

- **字母：** `a-z`
- **数字：** `0-9`
- **特殊键：** `escape`、`esc`、`enter`、`return`、`tab`、`space`、`backspace`、`delete`、`insert`、`clear`、`home`、`end`、`pageUp`、`pageDown`、`up`、`down`、`left`、`right`
- **功能键：** `f1`-`f12`
- **符号：** `` ` ``、`-`、`=`、`[`、`]`、`\`、`;`、`'`、`,`、`.`、`/`、`!`、`@`、`#`、`$`、`%`、`^`、`&`、`*`、`(`、`)`、`_`、`+`、`|`、`~`、`{`、`}`、`:`、`<`、`>`、`?`

示例：`ctrl+shift+x`、`alt+ctrl+x`、`ctrl+shift+alt+x`、`super+k`、`ctrl+super+k` 和 `ctrl+1`。

`super` 绑定需要终端单独上报该修饰键，通常通过 Kitty keyboard protocol。在不支持的终端中它们可能无法工作。

## 动作

### 终端 UI

#### 光标移动

| 快捷键 id | 默认值 | 说明 |
|---|---|---|
| `tui.editor.cursorUp` | `up` | 向上移动光标，在顶部浏览更早的历史 |
| `tui.editor.cursorDown` | `down` | 向下移动光标，在底部浏览更新的历史 |
| `tui.editor.historyPrevious` | 无 | 选择上一条提示历史条目 |
| `tui.editor.historyNext` | 无 | 选择下一条提示历史条目 |
| `tui.editor.cursorLeft` | `left`、`ctrl+b` | 向左移动光标 |
| `tui.editor.cursorRight` | `right`、`ctrl+f` | 向右移动光标 |
| `tui.editor.cursorWordLeft` | `alt+left`、`ctrl+left`、`alt+b` | 光标左移一个词 |
| `tui.editor.cursorWordRight` | `alt+right`、`ctrl+right`、`alt+f` | 光标右移一个词 |
| `tui.editor.cursorLineStart` | `home`、`ctrl+a` | 移到行首 |
| `tui.editor.cursorLineEnd` | `end`、`ctrl+e` | 移到行尾 |
| `tui.editor.jumpForward` | `ctrl+]` | 向前跳到字符 |
| `tui.editor.jumpBackward` | `ctrl+alt+]` | 向后跳到字符 |
| `tui.editor.pageUp` | `pageUp`、`ctrl+pageUp` | 向上翻页 |
| `tui.editor.pageDown` | `pageDown`、`ctrl+pageDown` | 向下翻页 |

专门的历史动作会忽略光标位置直接浏览提示历史，并优先于使用相同按键的应用动作。

#### 文本编辑

| 快捷键 id | 默认值 | 说明 |
|---|---|---|
| `tui.editor.deleteCharBackward` | `backspace` | 向后删除字符 |
| `tui.editor.deleteCharForward` | `delete`、`ctrl+d` | 向前删除字符 |
| `tui.editor.deleteWordBackward` | `ctrl+w`、`alt+backspace` | 向后删除词 |
| `tui.editor.deleteWordForward` | `alt+d`、`alt+delete` | 向前删除词 |
| `tui.editor.deleteToLineStart` | `ctrl+u` | 删除到行首 |
| `tui.editor.deleteToLineEnd` | `ctrl+k` | 删除到行尾 |
| `tui.editor.yank` | `ctrl+y` | 粘贴最近删除的文本 |
| `tui.editor.yankPop` | `alt+y` | 粘贴后循环切换已删除的文本 |
| `tui.editor.undo` | `ctrl+-`（Windows 上为 `ctrl+z`；WSL 上为 `alt+z`） | 撤销上一次编辑 |

#### 输入与选择

| 快捷键 id | 默认值 | 说明 |
|---|---|---|
| `tui.input.newLine` | `shift+enter`、`ctrl+j` | 插入新行 |
| `tui.input.submit` | `enter` | 提交输入 |
| `tui.input.tab` | `tab` | Tab 或自动补全 |
| `tui.input.copy` | `ctrl+c` | 复制选区 |
| `tui.select.up` | `up` | 向上移动选择 |
| `tui.select.down` | `down` | 向下移动选择 |
| `tui.select.pageUp` | `pageUp` | 在列表中向上翻页 |
| `tui.select.pageDown` | `pageDown` | 在列表中向下翻页 |
| `tui.select.confirm` | `enter` | 确认选择 |
| `tui.select.cancel` | `escape`、`ctrl+c` | 取消选择 |

#### 全屏

在全屏模式下，这些动作控制记录视图，并优先于使用相同按键的编辑器动作。当浮层或可滚动列表（例如自动补全、`/settings` 或模型选择器）获得焦点时，滚动和提示跳转动作会作用于它而不是记录视图，因此 `tui.select.pageUp` 和 `tui.select.pageDown` 会移动列表选择。记录搜索动作仍然有效。

| 快捷键 id | 默认值 | 说明 |
|---|---|---|
| `tui.altScreen.pageUp` | `pageUp` | 将记录向上滚动一页 |
| `tui.altScreen.pageDown` | `pageDown` | 将记录向下滚动一页 |
| `tui.altScreen.halfPageUp` | 无 | 将记录向上滚动半页 |
| `tui.altScreen.halfPageDown` | 无 | 将记录向下滚动半页 |
| `tui.altScreen.lineUp` | 无 | 将记录向上滚动一行 |
| `tui.altScreen.lineDown` | 无 | 将记录向下滚动一行 |
| `tui.altScreen.previousPrompt` | `ctrl+shift+up`、`ctrl+up`（仅在 Windows 和 WSL 上为 `ctrl+up`） | 跳到上一条标记的消息 |
| `tui.altScreen.nextPrompt` | `ctrl+shift+down`、`ctrl+down`（仅在 Windows 和 WSL 上为 `ctrl+down`） | 跳到下一条标记的消息 |
| `tui.altScreen.search` | `ctrl+shift+f`（Windows 和 WSL 上为 `ctrl+f`） | 搜索已渲染的记录 |
| `tui.altScreen.searchNext` | `enter`、`ctrl+g` | 搜索时选择下一个匹配项 |
| `tui.altScreen.searchPrevious` | `shift+enter`、`ctrl+shift+g` | 搜索时选择上一个匹配项 |
| `tui.altScreen.searchClose` | `escape` | 关闭记录搜索 |
| `tui.altScreen.top` | `ctrl+home` | 滚动到记录开头 |
| `tui.altScreen.bottom` | `ctrl+end` | 滚动到记录末尾并跟随新输出 |

### 应用

| 快捷键 id | 默认值 | 说明 |
|--------|---------|-------------|
| `app.interrupt` | `escape` | 取消 / 中止 |
| `app.clear` | `ctrl+c` | 清空编辑器（第一次）/ 退出（第二次） |
| `app.exit` | `ctrl+d` | 退出（编辑器为空时） |
| `app.suspend` | `ctrl+z`（Windows 上为无） | 挂起到后台 |
| `app.editor.external` | `ctrl+g` | 在外部编辑器中打开（`externalEditor`、`$VISUAL`、`$EDITOR`、Windows 上的 Notepad，或其他平台上的 `nano`） |
| `app.clipboard.pasteImage` | `ctrl+v`（Windows 和 WSL 上为 `alt+v`、`ctrl+v`） | 在 macOS 上粘贴文件，或从剪贴板粘贴图片或文本 |

在原生 Windows 上，`app.suspend` 没有默认值，因为 Windows 终端不支持 Unix 作业控制。如果你手动分配，Pi 会显示一条状态消息而不是挂起。WSL 使用常规的 `ctrl+z` 和 `fg` 行为。

### 会话

| 快捷键 id | 默认值 | 说明 |
|--------|---------|-------------|
| `app.session.new` | 无 | 开始新会话（`/new`） |
| `app.session.tree` | 无 | 打开会话树导航器（`/tree`） |
| `app.session.fork` | 无 | fork 当前会话（`/fork`） |
| `app.session.resume` | 无 | 打开会话恢复选择器（`/resume`） |
| `app.session.togglePath` | `ctrl+p` | 切换路径显示 |
| `app.session.toggleSort` | `ctrl+s` | 切换排序模式 |
| `app.session.toggleNamedFilter` | `ctrl+n` | 切换仅显示有名称的过滤器 |
| `app.session.rename` | `ctrl+r` | 重命名会话 |
| `app.session.delete` | `ctrl+d` | 删除会话 |
| `app.session.deleteNoninvasive` | `ctrl+backspace` | 查询为空时删除会话 |

### 模型与思考

| 快捷键 id | 默认值 | 说明 |
|--------|---------|-------------|
| `app.model.select` | `ctrl+l` | 打开模型选择器 |
| `app.model.cycleForward` | `ctrl+p` | 循环到下一个模型 |
| `app.model.cycleBackward` | `shift+ctrl+p`（Windows 和 WSL 上为 `alt+p`） | 循环到上一个模型 |
| `app.models.save` | `ctrl+s` | 将选定的默认模型或范围模型配置保存到设置 |
| `app.thinking.cycle` | `shift+tab` | 循环思考级别 |
| `app.thinking.save` | `ctrl+s` | 将当前思考级别保存到设置 |
| `app.thinking.toggle` | `ctrl+t` | 折叠或展开思考块 |

### 显示与消息队列

| 快捷键 id | 默认值 | 说明 |
|--------|---------|-------------|
| `app.tools.expand` | `ctrl+o` | 折叠或展开工具输出 |
| `app.message.copy` | `ctrl+x` | 在 `/tree` 中复制选中的消息；在全屏模式下，当 `fullscreenCopyOnSelect` 为 `false` 时复制当前选区，否则复制最后一条 assistant 消息。在 OAuth 登录界面上，复制登录 URL |
| `app.message.followUp` | `alt+enter`（Windows 和 WSL 上为 `ctrl+q`） | 将后续消息加入队列 |
| `app.message.dequeue` | `alt+up`（Windows 和 WSL 上为 `alt+q`） | 将排队的消息恢复到编辑器 |

### 树导航

| 快捷键 id | 默认值 | 说明 |
|--------|---------|-------------|
| `app.tree.foldOrUp` | `ctrl+left`、`alt+left` | 折叠当前分支段，或跳到上一个段的起始位置 |
| `app.tree.unfoldOrDown` | `ctrl+right`、`alt+right` | 展开当前分支段，或跳到下一个段的起始位置或分支末尾 |
| `app.tree.editLabel` | `shift+l` | 编辑所选树节点上的标签 |
| `app.tree.toggleLabelTimestamp` | `shift+t` | 在树中切换标签时间戳 |
| `app.tree.filter.default` | `ctrl+d` | 将树过滤器设为默认视图 |
| `app.tree.filter.noTools` | `ctrl+t` | 切换隐藏工具结果的树过滤器 |
| `app.tree.filter.userOnly` | `ctrl+u` | 切换仅显示用户消息的树过滤器 |
| `app.tree.filter.labeledOnly` | `ctrl+l` | 切换仅显示有标签条目的树过滤器 |
| `app.tree.filter.all` | `ctrl+a` | 切换显示所有条目的树过滤器 |
| `app.tree.filter.cycleForward` | `ctrl+o` | 向前循环树过滤器 |
| `app.tree.filter.cycleBackward` | `shift+ctrl+o` | 向后循环树过滤器 |

### 范围模型选择器

用于范围模型选择器内部（通过 `/scoped-models` 打开）。

| 快捷键 id | 默认值 | 说明 |
|--------|---------|-------------|
| `app.models.enableAll` | `ctrl+a` | 启用所有模型（或所有匹配当前搜索的模型） |
| `app.models.clearAll` | `ctrl+x` | 清除所有模型（或所有匹配当前搜索的模型） |
| `app.models.toggleProvider` | `ctrl+p` | 切换当前 provider 的所有模型 |
| `app.models.reorderUp` | `alt+up` | 将所选模型在循环顺序中上移 |
| `app.models.reorderDown` | `alt+down` | 将所选模型在循环顺序中下移 |