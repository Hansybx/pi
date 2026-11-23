> 这是简体中文译本，译自 `packages/coding-agent/docs/configuration.md`。与英文原文如有出入，以原文为准。

# 配置

Pi 支持用户级和项目级配置。用户级配置位于 agent 目录，默认为 `~/.pi/agent`。项目配置位于工作目录下的 `.pi`，并在授予[项目信任](security.md#understand-project-trust)后加载。唯一的例外是 `sessionDir`，Pi 在解析信任之前读取它，以便定位会话。

在交互模式下，使用 `/settings` 更改常用偏好。对于其他选项，请让 Pi 更新配置，或直接编辑相关文件。手动更改设置、快捷键、指令或资源后，运行 `/reload`。

## agent 目录

agent 目录在下面显示为 `<agent-dir>`。使用 `PI_CODING_AGENT_DIR` 环境变量或 SDK 的 [`agentDir`](sdk.md) 选项设置其位置。

| 路径 | 职责 |
|---|---|
| `<agent-dir>/settings.json` | 用户级[设置](settings.md)，包括偏好、默认值、资源路径和 Pi 包声明。 |
| `<agent-dir>/keybindings.json` | 自定义终端 UI 和应用的[快捷键](keybindings.md)。 |
| `<agent-dir>/mcp.json` | 在每个项目中都可用的 [MCP 服务器](mcp.md)。 |
| `<agent-dir>/models.json` | [兼容端点、模型和模型覆盖](models.md#configure-a-compatible-endpoint)。 |
| `<agent-dir>/auth.json` | 保存的 API 密钥和 OAuth 凭证。 |
| `<agent-dir>/AGENTS.override.md`、`AGENTS.md`、`AGENTS.MD`、`CLAUDE.md` 或 `CLAUDE.MD` | 跨工作目录应用的用户指令。 |
| `<agent-dir>/SYSTEM.md` | 替换 Pi 的默认系统提示词。 |
| `<agent-dir>/APPEND_SYSTEM.md` | 向 Pi 的系统提示词添加指令。 |
| `<agent-dir>/extensions/` | 用户[扩展](../../../packages/coding-agent/docs/extensions.md)。 |
| `<agent-dir>/skills/` | 用户[技能](skills.md)和支持文件。 |
| `<agent-dir>/prompts/` | 作为斜杠命令暴露的用户[提示模板](prompt-templates.md)。 |
| `<agent-dir>/themes/` | 用户[主题](themes.md)文件。 |

## 项目 `.pi` 目录

| 路径 | 职责 |
|---|---|
| `.pi/settings.json` | 项目级[设置](settings.md)、资源路径和 Pi 包声明。 |
| `.pi/mcp.json` | 项目的 [MCP 服务器](mcp.md)。 |
| `.pi/SYSTEM.md` | 替换该项目的系统提示词。 |
| `.pi/APPEND_SYSTEM.md` | 向系统提示词添加项目特定的指令。 |
| `.pi/extensions/` | 项目扩展。 |
| `.pi/skills/` | 项目技能和支持文件。 |
| `.pi/prompts/` | 作为斜杠命令暴露的项目提示模板。 |
| `.pi/themes/` | 项目主题文件。 |

对于 `SYSTEM.md` 和 `APPEND_SYSTEM.md`，受信任的项目文件优先于 agent 目录中对应的文件。同名文件不会合并。

## 上下文文件

上下文文件与项目的 `.pi` 配置彼此独立。Pi 从 agent 目录、工作目录及其父目录加载它们。只要 Pi 在该文件所在目录或其下任意位置运行，该上下文文件就会生效。

`AGENTS.override.md` 仅在同一目录中替换 `AGENTS.md` 或 `CLAUDE.md`。它不会抑制 agent 目录或其他目录中的上下文文件。

发现上下文文件不需要项目信任。
