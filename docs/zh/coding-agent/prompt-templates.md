> 这是简体中文译本，译自 `packages/coding-agent/docs/prompt-templates.md`。与英文原文如有出入，以原文为准。

# 提示模板

提示模板把 Markdown 文件变成可复用的 `/` 命令。当你希望复用同一提示，又不想添加可执行行为或更大一组的支持指令时，使用提示模板。

模板可以接受参数并出现在命令补全中。Pi 可以从个人配置、项目配置、显式路径或 Pi 包加载模板。项目配置只有在授予项目信任后才会加载。

## 创建模板

创建 `~/.pi/agent/prompts/review.md`：

```markdown
---
description: Review staged git changes
argument-hint: "[focus]"
---
Review the staged changes. Focus on ${1:-correctness, security, and error handling}.
```

文件名成为命令名，因此该模板可用作 `/review`。`description` 会出现在命令补全中。如果省略它，Pi 使用第一个非空行。

`argument-hint` 是可选的。必需参数使用 `<angle brackets>`，可选参数使用 `[square brackets]`。

在活动会话中添加或修改模板后，运行 `/reload`。

<a id="invoke-a-template"></a>

## 使用模板

在编辑器中输入模板命令：

```text
/review
/review concurrency
```

Pi 在生成的文本进入 agent 之前展开模板。除非有同名扩展命令处理它，否则扩展会先通过 `input` 事件收到原始输入。

模板支持这些替换：

| 语法 | 结果 |
|---|---|
| `$1`、`$2`、… | 一个位置参数 |
| `$@` 或 `$ARGUMENTS` | 所有参数以空格连接 |
| `${1:-default}` | 第一个参数，或默认值 |
| `${@:-default}` | 所有参数，或默认值 |
| `${@:N}` | 从位置 `N` 开始的参数 |
| `${@:N:L}` | 从位置 `N` 开始的 `L` 个参数 |

参数遵循类似 shell 的引号规则，因此 `/review "API compatibility"` 提供一个包含空格的参数。引号只在参数开头才开始引用，因此 `doesn't` 这类单词中的撇号会保持为文本，没有配对结尾的引号也会保留为文本。在带引号的参数内部，同一引号字符前的反斜杠会使其保持为文本，因此 `/review "the \"fast\" path"` 提供 `the "fast" path`；其他反斜杠按原样保留。

<a id="choose-where-it-loads"></a>

## 添加到 Pi

把模板放在你的用户或项目提示目录中。约定提示目录只加载直接子级的 `.md` 文件。

设置和包可以选择嵌套的 Markdown 文件；包清单可以用显式路径和 glob 缩小发现范围。这些选项见[设置](settings.md#resources)和 [Pi 包](packages.md)。

授予信任后，项目模板会成为编辑器中的命令。在信任不熟悉的项目之前，请审查其内容。见[安全](security.md#understand-project-trust)。
