> 这是简体中文译本，译自 `packages/coding-agent/docs/skills.md`。与英文原文如有出入，以原文为准。

# 技能

技能为 Pi 提供针对某类工作的专门指令和支持文件。Pi 按名称和描述公布每个可用技能，只在任务需要时才加载其完整指令。

当某个工作流需要的上下文比提示模板更多，但又不需要新的可执行集成点时，使用技能。技能可以在指令之外捆绑脚本、参考资料和资源。

Pi 实现了 [Agent Skills 规范](https://agentskills.io/specification)。大多数字段无效时只会产生警告，而不会阻止启动。

## 创建技能

技能是一个包含 `SKILL.md` 的目录：

```text
pdf-tools/
├── SKILL.md
├── scripts/
│   └── extract.sh
├── references/
│   └── formats.md
└── assets/
    └── template.json
```

`SKILL.md` 以 frontmatter 开头，后面是直接的指令：

```markdown
---
name: pdf-tools
description: Extract text and tables from PDF files. Use when reading, converting, or inspecting PDFs.
---

# PDF tools

Read `references/formats.md` before converting a document. Run scripts relative to this skill directory.
```

描述决定模型何时考虑加载技能。要同时说明技能做什么以及何时适用。避免 “Helps with PDFs” 这类描述，它们没有提供足够的路由信息。

引用捆绑文件时，使用相对于技能目录的路径。Pi 会告诉模型技能所在位置，以便解析这些路径。

## 理解技能的加载方式

启动时，Pi 扫描已配置的技能位置，并把每个技能的名称、描述和路径添加到系统提示词。它不会添加完整指令。

当任务匹配时，模型读取 `SKILL.md` 并遵循其指令。这样详细指导在需要之前不会进入上下文。模型可能无法加载相关技能，因此当你需要强制加载时，使用 `/skill:name`。

`/skill:name` 之后的参数会作为用户请求追加到已加载的指令后面：

```text
/skill:pdf-tools extract report.pdf
```

当技能只应通过其显式命令使用时，在 frontmatter 中设置 `disable-model-invocation: true`。`enableSkillCommands` [设置](settings.md)控制技能命令是否出现在交互式命令发现中；手动输入的 `/skill:name` 命令仍然有效。

<a id="choose-where-it-loads"></a>

## 添加到 Pi

把技能放在你的用户或项目技能目录中。包含 `SKILL.md` 的目录会被递归发现。

Pi 也支持 Agent Skills 的位置 `~/.agents/skills/` 和 `.agents/skills/`。项目的 `.agents/skills/` 目录会从工作目录开始向上逐级发现，存在仓库根目录时在该处停止。

Pi 接受某些独立的 Markdown 技能，但包含 `SKILL.md` 的目录是可移植形式，应优先使用。其他位置见[设置](settings.md#resources)和 [Pi 包](packages.md)。

项目技能可以指示模型运行脚本或修改文件。授予项目信任之前，请审查不熟悉的技能及其支持文件。

## 编写可移植的 frontmatter

Agent Skills 规范定义了这些字段：

| 字段 | 用途 |
|---|---|
| `name` | 命令名和显示名 |
| `description` | 展示给模型的路由描述 |
| `license` | 许可证名称或捆绑的许可证文件 |
| `compatibility` | 环境要求 |
| `metadata` | 附加的键值元数据 |
| `allowed-tools` | 实验性的预批准工具列表 |
| `disable-model-invocation` | 使技能不在模型的自动选择中出现 |

名称使用小写字母、数字和连字符，不得有开头、结尾或连续的连字符。名称最多 64 个字符；描述最多 1024 个字符。

当声明的名称与父目录不同时，Pi 既不要求也不警告。其他 Agent Skills 实现可能强制该要求，因此名称保持一致仍是可移植的选择。

格式错误的 `SKILL.md` 文件和未声明描述的技能不会被加载。名称冲突时保留第一个发现的技能并产生警告。

## 验证和分享技能

从技能可被发现的位置运行 Pi，然后检查启动诊断信息和 `/skill:name` 命令。在活动会话中编辑技能后，运行 `/reload`。

使用 [Pi 包](packages.md)通过 npm 或 git 分发一个或多个技能。把环境设置保留在技能内部，并在包中声明所需的运行时依赖。

示例见 [Anthropic 技能集合](https://github.com/anthropics/skills)和 [Pi 技能集合](https://github.com/badlogic/pi-skills)。
