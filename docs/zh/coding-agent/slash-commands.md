> 这是简体中文译本，译自 `packages/coding-agent/docs/slash-commands.md`。与英文原文如有出入，以原文为准。

# 斜杠命令

在 Pi 的终端编辑器中输入 `/` 可搜索当前会话中可用的命令。本页列出当前 Pi 版本中的内置命令。

扩展、提示模板和技能都可以添加命令。因此 Pi 中的命令菜单是会话已加载资源的准确参考。

## 模型与设置

| 命令 | 描述 |
|---|---|
| `/settings` | 打开设置 |
| `/model [provider/model]` | 选择一个模型 |
| `/thinking [level]` | 设置思考级别 |
| `/scoped-models` | 配置交互式循环使用的模型 |
| `/login [provider]` | 添加 provider 认证 |
| `/logout` | 移除 provider 认证 |
| `/llama` | 管理已配置的 llama.cpp 路由器上的模型 |

## 会话与上下文

| 命令 | 描述 |
|---|---|
| `/new` | 启动一个新会话 |
| `/resume` | 恢复另一个会话 |
| `/name [name]` | 设置会话显示名称，省略时显示当前名称 |
| `/session` | 显示当前会话信息和统计 |
| `/tree` | 浏览会话树 |
| `/fork` | 从先前的用户消息创建新会话 |
| `/clone` | 在当前位置复制当前会话 |
| `/compact [instructions]` | 压缩当前上下文，可选自定义指令 |
| `/import <path>` | 导入 JSONL 会话，保留其 ID 和工作目录 |

## 导出与分享

| 命令 | 描述 |
|---|---|
| `/copy` | 复制最后一条助手消息 |
| `/export [path]` | 将会话导出为 HTML 或 JSONL |
| `/share` | 上传会话并返回查看链接 |
| `/bug [description]` | 为 Pi 开发者准备一份私密缺陷报告 |

在导出或分享会话之前请先检查。会话可能包含提示、工具参数、命令输出、文件内容以及对话期间暴露的凭证。

## 运行时与项目

| 命令 | 描述 |
|---|---|
| `/trust` | 为后续 Pi 进程保存项目信任决定 |
| `/mcp` | 管理 MCP 服务器：登录、重新连接、启用或禁用，以及更改暴露范围 |
| `/reload` | 重新加载快捷键、扩展、技能、模板、主题和上下文文件 |
| `/hotkeys` | 显示当前生效的键盘快捷键 |
| `/changelog` | 显示变更日志条目 |
| `/quit` | 退出 Pi |

## 由资源添加的命令

- 扩展可以注册带自身参数和补全行为的命令。
- 每个提示模板以其模板名称可用。
- 启用技能命令后，技能以 `/skill:name` 形式可用。

添加或更改已发现的命令资源后，请运行 `/reload`。它们的加载和命名规则参见 [扩展](../../../packages/coding-agent/docs/extensions.md)、[提示模板](prompt-templates.md) 和 [技能](skills.md)。
