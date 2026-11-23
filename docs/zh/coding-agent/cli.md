> 这是简体中文译本，译自 `packages/coding-agent/docs/cli.md`。与英文原文如有出入，以原文为准。

<a id="cli-and-modes-reference"></a>

# 命令行

本页介绍 Pi 内置的命令行命令与选项。运行 `pi --help`，或在任意命令后追加 `--help`，可查看你所安装版本的确切接口。顶层帮助还会列出由已加载扩展注册的选项。

```sh
pi [options] [--] [@files...] [messages...]
pi install <source> [options]
pi remove <source> [options]
pi uninstall <source> [options]
pi update [target] [options]
pi list
pi config [options]
pi auth login <provider> [--api-key] [--no-browser]
pi auth logout <provider>
pi auth <check|print-api-key|print-bearer-token> [options]
pi mcp <add|remove|list|login|logout> [options]
```

<a id="modes"></a>

## 调用与输出

```sh
pi
pi --print "Summarize this repository"
git diff | pi --print "Review this change"
pi --mode json "Inspect this repository" > events.jsonl
```

当 stdin 与 stdout 都连接终端时，Pi 会打开终端 UI，除非 `--print`、`--mode json` 或 `--mode rpc` 选择了其他接口。当任一流被重定向且未选择 JSON 或 RPC 模式时，Pi 使用 print 模式。关于如何在交互模式、print、JSON、RPC 与 SDK 集成之间选择，参见 [CLI 集成](cli-integration.md)。

| 输入 | 行为 |
|---|---|
| `message` | 提供初始提示词 |
| `@path` | 在首个提示词中包含文本文件或图片 |
| 管道输入的 stdin | 将其内容添加到首个提示词之前 |
| `--` | 停止解析选项，使提示词可以以 `-` 开头 |

Pi 从当前工作目录解析 `@path`。工作目录还决定项目配置、资源发现与会话分组。

`--print` 控制 Pi 是否只运行一次并退出。`--mode` 选择输出接口。当 stdin 与 stdout 都是终端时，`--mode text` 不会强制单次执行；需要该行为请使用 `--print`。

| 选项 | 行为 |
|---|---|
| `-p`, `--print` | 运行提供的提示词，将最终的助手文本写入 stdout，然后退出 |
| `--mode text` | 选择文本输出；stdin 与 stdout 都是终端时仍打开终端 UI |
| `--mode json` | 运行提供的提示词，将 JSONL 事件写入 stdout，然后退出 |
| `--mode rpc` | 从 stdin 读取 JSONL 命令，将响应与事件写入 stdout，直到关闭 |
| `--export <input> [output]` | 将会话文件导出为 HTML 并退出；省略 `output` 时推导目标路径 |

RPC 模式会拒绝 `@file` 参数。JSON 与 RPC 模式将 stdout 保留给协议记录。参见 [JSON 事件流](json.md) 与 [RPC 协议](rpc.md)。

<a id="model-options"></a>

## 模型

```sh
pi --model sonnet:high
```

模型选择参见 [选择模型](models.md)，凭证参见 [provider](providers.md)。

- `--provider <name>`<br>
  将 `--model` 的查找限制在单个 provider 内。需要 `--model`。
- `--model <pattern>`<br>
  按精确 ID 或模糊的 ID/名称匹配选择。接受 `provider/id` 以及可选的 `:<thinking>` 后缀。若多个 provider 匹配，Pi 优先选择已有凭证的那个，否则会要求指定 `--provider`。
- `--api-key <key>`<br>
  使用不持久化的 API key 覆盖。需要通过 `--model` 或 `--models` 选定模型。它不会在提供同一模型的多个 provider 之间做选择。
- `--thinking <level>`<br>
  设置为 `off`、`minimal`、`low`、`medium`、`high`、`xhigh` 或 `max`。它会覆盖 `--model` 的后缀，并被限制在模型能力范围内。
- `--models <patterns>`<br>
  设置逗号分隔的范围，用于启动与循环切换。接受精确 ID、模糊匹配、大小写不敏感的 glob 以及可选的 `:<thinking>` 后缀。若某个模型由多个 provider 提供，则为每个 provider 各添加一次，并给出警告。
- `--list-models [search]`<br>
  列出可用模型，可用模糊搜索过滤，然后退出。

<a id="session-options"></a>

## 会话

```sh
pi --continue
```

关于恢复、fork、命名与存储会话，参见 [会话与上下文](sessions.md)。

- `-c`, `--continue`<br>
  继续当前目录最近的会话。
- `-r`, `--resume`<br>
  打开会话选择器，并在所选会话的工作目录中恢复它。按 Tab 可包含其他目录的会话。
- `--session <path|id>`<br>
  按文件路径或完整/部分 ID 打开会话，并在其工作目录中恢复。若该 ID 只匹配为其他目录存储的会话，Pi 会提示将其 fork 到当前目录。
- `--session-id <id>`<br>
  打开当前目录中具有该 ID 的现有会话，否则创建它。ID 接受字母、数字、`.`、`_` 与 `-`。
- `--fork <path|id>`<br>
  按文件路径或完整/部分 ID 选择会话，并将其 fork 到当前目录的新会话中。
- `--session-dir <dir>`<br>
  覆盖存储与查找。优先级高于 `PI_CODING_AGENT_SESSION_DIR` 与 `sessionDir` 设置。
- `--no-session`<br>
  使用不持久化的内存会话。
- `-n`, `--name <name>`<br>
  设置会话显示名称。

约束：

- 会话 ID 必须以字母或数字开头和结尾。
- `--fork` 不能与 `--session`、`--continue`、`--resume` 或 `--no-session` 组合使用。
- `--session-id` 不能与 `--session`、`--continue` 或 `--resume` 组合使用。可与 `--fork` 组合以指定新的 ID。

<a id="tool-options"></a>

## 工具

```sh
pi --tools read,grep,find,ls --print "Review this project"
```

关于配置默认工具选择，参见 [设置](settings.md#tools)。

- `-t`, `--tools <list>`<br>
  用逗号分隔的允许列表替换默认选择，列表可包含内置工具、扩展工具或自定义工具。条目是工具名或模式，其中 `*` 匹配任意字符。除非某个条目以 `mcp__` 开头，否则 MCP 工具会被保留（参见 [MCP 工具](#mcp-tools)）。仅由 `+name` 与 `-name` 条目组成的列表不是允许列表；它会修改默认选择。
- `-xt`, `--exclude-tools <list>`<br>
  在所有其他选择选项（包括 MCP 工具）生效之后，禁用逗号分隔的工具名或模式。
- `-nbt`, `--no-builtin-tools`<br>
  禁用默认内置工具，同时保留扩展工具与自定义工具。
- `-nt`, `--no-tools`<br>
  启动时禁用所有内置工具、扩展工具、自定义工具与 MCP 工具。

默认启用的工具是 `read`、`bash`、`edit` 与 `write`，除非 `defaultTools` 改变了它们。使用普通名称的 `--tools` 会替换整个选择，因此要列出你想要的每个工具。与 `defaultTools` 一样，它也可以只接受 `+name` 与 `-name` 条目，用于在默认选择上增删工具：`pi --tools +codemode,-write` 保留其他默认工具，启用 `codemode`，并禁用 `write`。这些条目使用确切的工具名，而非 `*` 模式；要按模式禁用工具请使用 `--exclude-tools`。普通名称与 `+name`/`-name` 条目不能混用。`/reload` 会启用新加入 `defaultTools` 的工具，但用 `-name` 移除的工具会保持移除状态。

<a id="mcp-tools"></a>

`--tools` 选择声明给模型的工具。它不会移除 MCP 工具，MCP 工具的可达范围由其[暴露方式](mcp.md#control-tool-exposure)决定：`pi --tools read,codemode` 会让所有 MCP 工具仍可从 codemode 脚本调用。没有任何条目指定或匹配的 MCP 工具绝不会被直接声明，无论其暴露方式如何；只有 `tool_search`（若已列出）能加载它。一旦某个条目以 `mcp__` 开头，`--tools` 也会过滤 MCP 工具，因此下面的命令只保留 `radius` 服务器的工具：

```sh
pi --tools read,bash,codemode,'mcp__radius__*'
```

MCP 资源工具（`list_mcp_resources`、`list_mcp_resource_templates`、`read_mcp_resource`）也计为 MCP 工具。要移除 MCP 工具，使用 `--exclude-tools 'mcp__*'` 或 [`--no-mcp`](#resource-options)。

| 内置工具 | 用途 |
|---|---|
| `read` | 读取文本文件与支持的图片 |
| `bash` | 运行 shell 命令 |
| `powershell` | 在 Windows 上运行 PowerShell 命令 |
| `edit` | 对现有文件应用精确的文本替换 |
| `write` | 创建或覆盖文件 |
| `grep` | 搜索文件内容 |
| `find` | 使用 glob 模式查找路径 |
| `ls` | 列出目录内容 |

内置扩展额外提供两个工具。它们默认关闭；当 MCP 服务器需要时，MCP 扩展会开启它们（参见 [MCP](mcp.md#control-tool-exposure)）。要自行启用，请在 `--tools` 或 `defaultTools` 中指定它们。

| 内置扩展 | 用途 |
|---|---|
| `codemode` | 运行调用其他工具的 JavaScript，例如用 `Promise.allSettled` 并行调用；只有脚本的输出会到达模型 |
| `tool_search` | 搜索未声明给模型的工具（`codemode` 与 `deferred` 暴露方式，例如 MCP 工具），并为下一次调用声明匹配项 |

### 启用 codemode

要为每个会话开启 `codemode`，请将其加入 `~/.pi/agent/settings.json` 或项目的 `.pi/settings.json` 的默认工具中：

```json
{
  "defaultTools": ["+codemode"]
}
```

这会保留 `read`、`bash`、`edit` 与 `write`，并添加 `codemode`。若只想在单次调用中启用，可用 `--tools` 添加：

```sh
pi --tools +codemode
```

即使没有 MCP，Codemode 也很有用：脚本可以并行运行多个工具调用，在大型输出到达模型之前过滤它，通过 `models.classify()` 调用 TypeSafe 的 Jev 等分类模型（参见 [分类模型](models.md#use-classifier-models)），并通过 `models.generateImages()` 生成图片（参见 [图像模型](models.md#use-image-models)）。

### codemode 的工作方式

脚本在 QuickJS 沙箱中运行，并通过 `tools.<name>(args)` 访问其他工具。[Codemode](codemode.md) 介绍了脚本 API、工具的列出与查找方式、`store()` 与 `models` 全局对象以及各项限制。

### 工具搜索

`tool_search` 默认关闭；可通过 `"defaultTools": ["+tool_search"]` 或 `--tools` 启用。它对尚未声明的工具使用与 `searchTools()` 相同的排序，并为下一次模型调用声明匹配项。已加载的工具会像其他工具变更一样记录在会话中，因此在该分支上保持已声明状态。

<a id="resource-options"></a>

## 资源

```sh
pi --extension ./review.ts
```

关于约定目录与项目信任，参见 [配置](configuration.md)；关于配置路径，参见 [设置](settings.md#resources)；关于包来源，参见 [Pi 包](packages.md)。

- `-e`, `--extension <path>`<br>
  加载扩展文件或目录，或内置扩展（如 `builtin:mcp`），可重复使用。
- `-ne`, `--no-extensions`<br>
  禁用发现到的、配置的与内置的扩展。显式的 `-e` 路径仍会加载，因此 `pi -ne -e builtin:mcp` 只保留内置 MCP 支持。
- `--no-mcp`<br>
  为本次运行禁用内置 MCP 支持：不连接任何服务器，也没有 MCP 工具或 `/mcp`。它不影响替代内置 MCP 支持的扩展。
- `--skill <path>`<br>
  加载技能文件或目录，可重复使用。
- `-ns`, `--no-skills`<br>
  禁用发现到的与配置的技能。显式的 `--skill` 路径仍会加载。
- `--prompt-template <path>`<br>
  加载提示模板文件或目录，可重复使用。
- `-np`, `--no-prompt-templates`<br>
  禁用发现到的与配置的模板。显式的 `--prompt-template` 路径仍会加载。
- `--theme <path>`<br>
  加载主题文件或目录，可重复使用。
- `--use-theme <name[/name]>`<br>
  为本次运行选择初始交互主题。
- `--no-themes`<br>
  禁用发现到的与配置的主题。显式的 `--theme` 路径仍会加载。
- `-nc`, `--no-context-files`<br>
  禁用 `AGENTS.md` 与 `CLAUDE.md` 的发现。

资源路径仅对当前进程生效。相对路径从当前工作目录解析。

<a id="prompt-and-display-options"></a>

## 提示词与进程

```sh
pi --append-system-prompt ./instructions.md
```

关于保存的配置，参见 [配置](configuration.md)；关于项目信任，参见 [安全](security.md#understand-project-trust)；关于进程控制，参见 [环境变量](environment-variables.md)。

- `--system-prompt <text|path>`<br>
  用文本或现有文件的内容替换默认系统提示词。
- `--append-system-prompt <text|path>`<br>
  将文本或现有文件追加到系统提示词，可重复使用。
- `--tui-mode <mode>`<br>
  使用 `fullscreen`（默认）或 `regular` 终端模式。
- `--verbose`<br>
  显示详细的交互式启动信息，覆盖 `quietStartup`。
- `-a`, `--approve`<br>
  为当前进程信任项目本地配置与资源。
- `-na`, `--no-approve`<br>
  为当前进程忽略受信任门控的项目本地配置与资源。
- `--offline`<br>
  禁用自动网络活动，包括模型目录刷新。等价于 `PI_OFFLINE=1`。
- `-h`, `--help`<br>
  显示帮助（包括已加载扩展注册的标志），然后退出。
- `-v`, `--version`<br>
  显示 Pi 版本，然后退出。

扩展可注册额外的长格式选项。未知的短选项会被拒绝。

## 包命令

```sh
pi install npm:@scope/package
```

关于来源格式、过滤、安装与项目范围，参见 [Pi 包](packages.md)。

### 常见任务

| 任务 | 命令 |
|---|---|
| 安装包 | `pi install <source>` |
| 列出已配置的包 | `pi list` |
| 移除包及其设置条目 | `pi remove <source>` |
| 配置加载哪些包资源 | `pi config` |

在 `install`、`remove`、`uninstall` 或 `config` 后加上 `--local` 或 `-l`，可使用项目设置而非全局设置。

### 更新 Pi 或包

不带目标运行 `pi update` 会更新 Pi 本身。

| 任务 | 命令 |
|---|---|
| 更新 Pi | `pi update` |
| 更新所有已安装的包 | `pi update --extensions` |
| 更新一个已安装的包 | `pi update <source>` |
| 刷新模型目录 | `pi update --models` |
| 更新 Pi 及所有已安装的包 | `pi update --all` |

当所选更新包含 Pi 时，加上 `--force` 可重新安装 Pi。

当 Pi 由其他包管理器（如 Nix）提供时，`pi update` 无法更新 Pi。请用该包管理器更新 Pi，例如 `nix profile upgrade pi`。包与模型目录的更新仍然可用。

#### 自定义更新命令

如果包装脚本或其他包管理器提供 Pi，可设置 `PI_SELF_UPDATE_COMMAND`，让 `pi update` 运行它的更新命令：

```sh
export PI_SELF_UPDATE_COMMAND="mise use -g npm:{packageName}@{version}"
```

只有当 pi.dev 上有更新版本时，`pi update` 才会运行它，并用该版本替换 `{packageName}`、`{version}` 与 `{installSpec}`（即 `{packageName}@{version}`）。该值按空格拆分。若参数中含空格，请改用 `~/.pi/agent/settings.json` 中的 `selfUpdateCommand` 设置，即一个 argv 数组，如 `["nix", "profile", "upgrade", "pi"]`。

### 别名与命令选项

- `pi uninstall <source>` 是 `pi remove <source>` 的别名。
- `pi update --self`、`pi update self` 与 `pi update pi` 都是 `pi update` 的别名。
- `pi update --extension <source>` 是 `pi update <source>` 的别名。
- `-a`、`--approve` 为单条命令信任项目本地文件。`-na`、`--no-approve` 忽略受信任门控的项目本地文件。
- 在命令后加上 `-h` 或 `--help` 可查看其确切用法与选项约束。

## 凭证命令

`pi auth login <provider>` 在终端中登录 provider 并退出，不会启动会话。它使用账号登录并打开浏览器，与 `/login <provider>` 类似。不支持账号登录的 provider 会要求输入 API key。登录 Radius 时，若尚无全局服务器使用该登录，还会将 Radius MCP 服务器添加到 `~/.pi/agent/mcp.json`。它需要交互式终端。

| 选项 | 描述 |
|---|---|
| `--api-key` | 保存 API key 而非使用账号登录；读取密钥时不会回显 |
| `--no-browser` | 不打开浏览器；使用 provider 的其他登录方式，例如设备码，适用于 SSH 场景。若有多种方式则会询问。不能与 `--api-key` 一起使用 |

`pi auth logout <provider>` 移除由 `pi auth login` 或 `/login` 存储的凭证，与 `/logout` 类似。环境变量与 `models.json` 配置保持不变。未存储任何内容时以状态 `0` 退出，因此可安全重复执行。

```sh
pi auth login radius
pi auth logout radius
pi auth check --provider openai --json
```

其他认证命令需要 `--provider <provider>` 或 `--model <model>`。支持的方法参见 [provider](providers.md)。

| 命令 | 描述 |
|---|---|
| `pi auth check` | 输出 `ready`、`not_ready` 或 `invalid`；分别以状态 `0`、`1` 或 `2` 退出 |
| `pi auth print-api-key` | 输出解析后的 API key |
| `pi auth print-bearer-token` | 输出解析后的 OAuth bearer token |

| 选项 | 适用于 | 描述 |
|---|---|---|
| `--provider <provider>` | 所有 | 解析某个 provider 的凭证 |
| `--model <model>` | 所有 | 从模型解析凭证；可与 `--provider` 组合 |
| `--json` | `auth check` | 以 JSON 写入结构化结果 |
| `--credentials` | `auth check` | 就绪时输出解析后的凭证 |
| `--no-refresh` | `auth check` | 不刷新过期的 OAuth 凭证；默认会刷新 |
| `--min-expiry <duration>` | `print-bearer-token` | 要求 token 剩余有效期，使用 `ms`、`s`、`m` 或 `h`，如 `30m` |

打印凭证的命令会将密钥写入 stdout。

## MCP 命令

这些命令可在会话之外运行，因此 agent 可以通过 `bash` 执行它们。参见 [MCP 服务器](mcp.md)。

| 命令 | 描述 |
|---|---|
| `pi mcp add <server> [options] -- <command> [args...]` | 在 `mcp.json` 中添加或替换 stdio 服务器；`--env KEY=VALUE`（可重复）与 `--cwd <dir>` 设置其环境与工作目录。命令之后的参数会传给它 |
| `pi mcp add <server> [options] --url <url>` | 添加或替换可流式 HTTP 服务器；`--header KEY=VALUE`（可重复）、`--bearer-token-env-var <NAME>`（发送 `Authorization: Bearer ${NAME}`）、`--oauth-client-id`、`--oauth-client-secret`、`--oauth-callback-port`、`--oauth-client-name` 与 `--oauth-client-registration`（`auto`、`cimd` 或 `dcr`）用于配置认证 |
| `pi mcp remove <server>` | 从 `mcp.json` 中移除服务器；已存储的 OAuth 凭证会保留 |
| `pi mcp list [--json]` | 连接每个已启用的服务器并输出其状态、工具与错误；当配置条目无效或已启用的服务器未连接时以 `1` 退出 |
| `pi mcp login <server> [-l] [--timeout <seconds>]` | 登录 OAuth 服务器：打开授权页面并等待浏览器；终端还接受粘贴的重定向 URL。`--timeout` 限制整个登录过程，包括对授权服务器的请求（默认 300 秒）。`-l` 要求服务器定义在项目的 `.pi/mcp.json` 中 |
| `pi mcp logout <server> [-l]` | 删除服务器已存储的 OAuth 凭证 |

`add` 与 `remove` 修改 `~/.pi/agent/mcp.json`，若使用 `--local`（`-l`）则修改当前目录的 `.pi/mcp.json`。`add` 还接受 `--exposure <mode>`（参见 [暴露](mcp.md#control-tool-exposure)）与 `--description <text>`，并且不会连接；运行 `pi mcp list` 检查该服务器。

只有已受信任的项目，其 `.pi/mcp.json` 文件才会被读取。