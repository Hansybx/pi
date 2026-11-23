> 这是简体中文译本，译自 `packages/coding-agent/docs/mcp.md`。与英文原文如有出入，以原文为准。

# MCP 服务器

Pi 通过 stdio 或可流式 HTTP 连接 [Model Context Protocol](https://modelcontextprotocol.io) 服务器，并把它们的工具和资源提供给模型。

## 快速配置

添加一个本地 stdio 服务器，检查连接，然后启动 Pi：

```bash
pi mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem .
pi mcp list
pi
```

远程服务器：

```bash
pi mcp add docs --url https://example.com/mcp --bearer-token-env-var DOCS_TOKEN
pi mcp list
```

这些命令默认添加用户级服务器。加上 `--local` 或 `-l` 可改为写入项目配置：

```bash
pi mcp add -l tools --env API_KEY='${TOOLS_KEY}' -- uvx tools-mcp
```

在交互模式会话内使用 `/mcp` 检查连接、登录、重连、更改暴露方式，或启用和禁用服务器。在会话外添加、删除或修改服务器后，运行 `/reload`。

## 配置服务器

Pi 从 `~/.pi/agent/mcp.json` 读取用户级服务器，从 `.pi/mcp.json` 读取项目服务器。只有在[项目信任](security.md#understand-project-trust)授予之后才会读取项目配置。项目条目会替换同名的用户级条目。

不含 `command`、`url` 或 `type` 的项目条目只覆盖同名用户级服务器的 `enabled`、`exposure` 和 `toolExposure`，其余内容（包括 `env`、`headers` 和 `auth`）保持不变。例如，下面这段在一个项目中关闭某个用户级服务器：

```json
{
  "mcpServers": {
    "internal-tools": { "enabled": false }
  }
}
```

格式与其他 MCP 客户端一致：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    },
    "docs": {
      "url": "https://example.com/mcp",
      "headers": { "Authorization": "Bearer ${DOCS_TOKEN}" },
      "description": "Search and read the product documentation"
    }
  }
}
```

stdio 服务器使用 `command`、`args`、`env` 和 `cwd`。相对的 `cwd` 值相对会话目录解析。`command`、某个参数或 `cwd` 中开头的 `~/` 表示主目录。

HTTP 服务器使用 `url`、`headers` 和 `oauth`（见[使用 OAuth 认证](#authenticate-with-oauth)）。不支持旧版 SSE 传输。

两种服务器类型都支持：

- `timeout`：每个请求的超时时间，单位为秒（默认 60）。进度通知会重置它。
- `enabled: false`：保留该条目但不连接。
- `exposure` 和 `toolExposure`：控制工具如何到达模型（见[控制工具暴露](#control-tool-exposure)）。
- `description`：用一句话说明该服务器提供什么。它会在系统提示词中列出该服务器（见[控制工具暴露](#control-tool-exposure)），工具搜索按它对该服务器的工具排序，codemode 的 `describeNamespace()` 返回它。没有它时，服务器连接后使用服务器指令的第一行。

把个人服务器和带凭证的服务器放在用户级文件里。项目文件只用于项目所需的服务器，且只在受信任的项目中使用。

### 配置规则

- 服务器名称只能包含字母、数字、`_` 和 `-`。工具命名为 `mcp__<server>__<tool>`，其中除字母、数字和 `_` 之外的每个字符都替换为 `_`；如果某个服务器的工具名因此冲突，它们都会加上哈希后缀。只在 `-` 和 `_` 上有区别的服务器名称视为同一个服务器：第二个会被拒绝，并且 `mcp.json` 中的服务器会覆盖已注册的服务器。
- `type` 是可选的。`command` 选择 stdio，`url` 选择可流式 HTTP。若提供 `type`，它必须是 `stdio`、`http` 或 `streamable-http`。
- `sse` 会被拒绝。文档中给出 SSE 端点的服务器通常也提供可流式 HTTP，一般位于 `/mcp` 而不是 `/sse`。
- `command` 是一个可执行文件，`args` 包含它的参数。它不是 shell 命令字符串。
- `env` 和 `headers` 的值可以使用 `${GITHUB_TOKEN}` 之类的环境变量。它们也可以用 `!command` 运行命令，但该命令必须构成整个值，例如 `"Authorization": "!echo Bearer $(gh auth token)"`。
- 无效条目会被报告并跳过，不影响其他服务器连接。

`pi mcp add` 和 `pi mcp remove` 覆盖了从 shell 进行的常见改动。选项见 [MCP 命令](cli.md#mcp-commands)。

### 检查或修改服务器

`/mcp` 列出已配置的服务器及其状态、工具数量、暴露方式和配置来源。需要关注的服务器排在最前面。选择一个服务器可检查其工具和连接详情、重连、登录或登出、更改暴露方式，或启用和禁用它。

暴露方式和启用状态的改动会保存到定义该服务器的文件，不会替换无关内容。在受信任的项目中，“Enable in this project”和“Disable in this project”会为用户级服务器添加项目覆盖；之后对该服务器的改动会保存到覆盖中。已禁用的服务器仍会列出。在交互式 TUI 之外，`/mcp` 打印服务器状态；`/mcp login <server>`、`/mcp logout <server>` 和 `/mcp reconnect <server>` 直接执行相应操作。

shell 命令无需会话即可运行：`pi mcp add`、`pi mcp remove`、`pi mcp list`、`pi mcp login` 和 `pi mcp logout`。shell 命令不会加载扩展。

### 诊断连接问题

运行 `pi mcp list` 可连接到每个已启用的服务器并打印其状态、工具和错误。当某个条目无效或某个已启用的服务器未连接时，它以状态码 1 退出。`/mcp` 显示完整的连接错误，以及连接失败的 stdio 服务器 stderr 的末尾部分。

Pi 在启动后一次性报告配置错误、连接失败和需要登录的情况。服务器日志通知会追加到 `~/.pi/agent/mcp.log`，格式为 `<time> [<server>] <level> <logger>: <message>`。文件超过 5 MB 后会被移动为 `mcp.log.1`。

会话启动时，Pi 在后台连接每个已启用的服务器。服务器连接后其工具才出现；`codemode` 的描述不列出它们，因此服务器连接时该描述不会变化。第一个提示词只会在最多 10 秒内等待带 `direct` 工具的服务器，这些工具必须在其请求中声明。其他服务器在需要时才等待：codemode 脚本会等待它指定的服务器（`mcp__<server>`），当它调用 `searchTools()` 或读取 `ALL_TOOLS` 时，会等待所有服务器；`tool_search` 和资源工具也会等待所有服务器。HTTP 网络错误和临时状态（408、429 和 5xx）会重试两次。断开的连接显示为未连接，并在下次调用时重连。当服务器宣告工具列表发生变化时，新工具会被添加，撤销的工具变为不可达。

停止 stdio 服务器会关闭其 stdin，发送 SIGTERM，然后向其进程组发送 SIGKILL。这也会停止通过 `npx` 或 `uvx` 等包装器启动的服务器。

## 从其他客户端迁移配置

把转换后的条目移到 `mcp.json` 中的 `mcpServers` 下，然后运行 `pi mcp list` 验证。

| 客户端 | 转换方式 |
|---|---|
| Claude Desktop、Claude Code 或 Cursor | 复制现有的 `mcpServers` 条目。 |
| VS Code | 从顶层 `servers` 对象中移出一个条目，并把 `${input:...}` 提示替换为 `${NAME}` 环境变量。 |
| Codex | 把 `[mcp_servers.<name>]` 中的 `command`、`args`、`env` 和 `url` 等 TOML 字段转换为 JSON。 |
| OpenCode | 把 `"type": "local"` 转换为 stdio 条目，把它的 `command` 数组拆分为 `command` 和 `args`，把 `environment` 改名为 `env`，并把 `{env:NAME}` 替换为 `${NAME}`。把 `"type": "remote"` 转换为 URL 条目。 |

<a id="authenticate-with-oauth"></a>

## 使用 OAuth 认证

使用 OAuth 的远程服务器（例如 Sentry）无需在 `mcp.json` 中提供凭证：

```json
{
  "mcpServers": {
    "sentry": { "url": "https://mcp.sentry.dev/mcp" }
  }
}
```

当服务器拒绝未认证的连接时，`/mcp` 会显示需要登录。选择“Sign in”，运行 `/mcp login sentry`，或运行 `pi mcp login sentry`。Pi 打开授权页面并等待批准。如果浏览器运行在另一台机器上（例如通过 SSH），把重定向后的 URL 粘贴到登录界面。运行中的会话会在下一轮次使用新的凭证。

Pi 通过其 Client ID Metadata Document 或注册客户端来向授权服务器标识自己，把 token 存储在 `~/.pi/agent/mcp-auth.json`，并在访问 token 过期或服务器拒绝时刷新它们。如果服务器之后请求额外的 scope，Pi 会再次要求登录。登出会删除已存储的凭证。

凭证属于服务器名称和 URL。相同 URL 但名称不同的服务器（例如每个账号一个）分别登录；位于不同 `mcp.json` 文件中、名称和 URL 相同的服务器共享同一次登录。

OAuth 适用于没有 `Authorization` 头的 HTTP 服务器。对于不支持动态客户端注册的服务器，配置一个已注册的客户端：

```json
{
  "mcpServers": {
    "example": {
      "url": "https://mcp.example.com/mcp",
      "oauth": { "clientId": "my-client", "clientSecret": "${EXAMPLE_SECRET}", "callbackPort": 8765 }
    }
  }
}
```

重定向 URI 必须与注册的 URI 匹配。`callbackPort` 使用 `http://127.0.0.1:<port>/callback`。要使用其他 URI，设置 `callbackUrl`；它必须在 `localhost`、`127.0.0.1` 或 `[::1]` 上使用 HTTP。Pi 会原样发送它。当 `callbackUrl` 省略端口时，Pi 使用 `callbackPort` 或一个空闲端口，并按 RFC 8252 对回环重定向的允许方式把端口加到 URI 上。`clientSecret` 是可选的，可以使用环境变量或命令。

对于不声明所需 scope 的服务器，把 `scope` 设置为空格分隔的列表。否则 Pi 请求所声明的 scope。之后的 scope 请求会追加到配置值上。

Pi 注册为 `pi`。某些服务器只接受来自已知客户端的注册。设置 `clientName` 可发送其他名称：

```json
{
  "mcpServers": {
    "figma": { "url": "https://mcp.figma.com/mcp", "oauth": { "clientName": "Claude Code" } }
  }
}
```

该名称只在 Pi 注册客户端时发送。要以新名称重新注册，请先登出。

没有 `clientId` 时，如果授权服务器声明支持文档和公共客户端，Pi 用 pi.dev 上的 Client ID Metadata Document 标识自己。否则它会动态注册客户端。之前注册的客户端只要重定向 URI 匹配就继续使用，直到你登出。使用文档时，客户端 ID 为 `https://pi.dev/oauth/client.json`，重定向 URI 为 `http://127.0.0.1:<port>/callback`。如果授权服务器在授权响应中不发送 `iss` 参数（RFC 9207），Pi 会改用特定于该 MCP 服务器的文档和重定向路径：`https://pi.dev/oauth/<id>/client.json` 和 `http://127.0.0.1:<port>/callback/<id>`。

当设置了 `clientName`，或 `callbackUrl` 不是 `localhost`、`127.0.0.1` 上的 `/callback` 时，Pi 会注册而不是使用文档。设置 `clientRegistration` 选择方式：`auto`（默认）为上述行为，`dcr` 总是注册，`cimd` 总是使用文档。使用 `cimd` 时，如果授权服务器不支持面向公共客户端的文档，登录会失败。当授权页面报告客户端无效时，使用 `dcr`：

```json
{
  "mcpServers": {
    "example": { "url": "https://mcp.example.com/mcp", "oauth": { "clientRegistration": "dcr" } }
  }
}
```

`pi mcp add --oauth-client-registration <mode>` 在添加服务器时设置它。`cimd` 不能与 `clientId` 或 `clientName` 组合，并且 `callbackUrl` 必须使用 `localhost` 或 `127.0.0.1`，路径为 `/callback`。

Pi 通过服务器的受保护资源元数据（RFC 9728）找到授权服务器，并检查授权服务器的元数据是否指明了预期的 issuer（RFC 8414）。某些服务器声明了错误的授权服务器或完全没有声明，导致登录打开一个不存在的页面。把 `authServerMetadataUrl` 设置为正确授权服务器的元数据文档：

```json
{
  "mcpServers": {
    "example": {
      "url": "https://mcp.example.com/mcp",
      "oauth": { "authServerMetadataUrl": "https://example.okta.com/.well-known/openid-configuration" }
    }
  }
}
```

Pi 使用该文档而不是发现流程，并按其配置信任它，因此只应指向你信任的文档。URL 必须使用 HTTPS，`localhost`、`127.0.0.1` 或 `[::1]` 除外。

<a id="control-tool-exposure"></a>

## 控制工具暴露

每个服务器工具注册为 `mcp__<server>__<tool>`。服务器的 `exposure` 决定模型如何访问它：

| 暴露方式 | 行为 | 典型用途 |
|---|---|---|
| `codemode`（默认） | 可从 [`codemode`](cli.md#tools) 脚本调用，但既不向模型声明，也不在 codemode 描述中列出。脚本用 `searchTools()`、`describeTool()` 或 `ALL_TOOLS` 查找工具。 | 通用 MCP 服务器，尤其是当脚本应组合或过滤调用时。 |
| `deferred` | 直到 [`tool_search`](cli.md#tools) 为下一次模型调用加载匹配项时才声明。 | 工具数量多、且这些工具应在发现后直接调用的服务器。 |
| `direct` | 像内置工具一样向模型声明，也可从 codemode 调用。 | 小型、频繁使用的工具集。 |
| `hidden` | 已注册但不可达。 | 应保持不可用的服务器或工具。 |

`codemode-deferred` 可作为 `codemode` 的别名接受。

带 `codemode` 或 `deferred` 工具的服务器会列在系统提示词的 `mcp_servers` 部分，并附上如何访问其工具的说明，以及配置的 `description` 中的一行，或在连接后取自服务器指令的一行。Pi 在提示词开始时更新该部分，此时已等待过带 `direct` 工具的服务器。当该部分发生变化时（例如某个服务器已连接、其摘要变得可用），Pi 会把新的部分追加到对话中，而不是更改工具声明，从而让较早的消息保持缓存。`describeNamespace()` 和 `searchTools()` 的 `namespace` 选项接受 `mcp__dev-radius`、`mcp__dev_radius`、`dev-radius` 或 `dev_radius`。

当带 `codemode` 暴露方式的服务器连接时，Pi 会激活 `codemode`。对于带 `deferred` 暴露方式的服务器，Pi 会激活 `tool_search`。要让模型无需搜索就能看到一个工具，用 `toolExposure` 给它 `direct` 暴露方式。

`toolExposure` 为单个工具覆盖服务器的暴露方式。键是精确的服务器工具名，或 `*` 匹配任意字符的模式。精确名称优先于模式；在多个模式中，第一个匹配的生效。带 `hidden` 暴露方式的服务器可以只暴露选中的工具：

```json
{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "exposure": "deferred",
      "toolExposure": {
        "search_code": "direct",
        "get_*": "codemode",
        "delete_*": "hidden"
      }
    }
  }
}
```

`pi mcp list` 会标记暴露方式与其服务器不同的工具。`/mcp` 中的 Tools 视图也会显示实际生效的暴露方式。

带 `codemode` 或 `deferred` 暴露方式的工具可以通过任一种间接机制访问：codemode 脚本可以调用它们，`tool_search` 可以加载它们。codemode 调用不依赖当前激活的工具集，因此在 `/tree`、resume 和 fork 之后仍然可用。由 `tool_search` 加载的工具会记录到对话记录中，并在该分支上保持声明。

除非某个条目以 `mcp__` 开头，否则 `--tools` 不会移除 MCP 工具；`pi --tools read,codemode,'mcp__radius__*'` 只保留 `radius` 的工具。`--exclude-tools` 接受相同的模式，`--no-mcp` 在单次运行中禁用 MCP（见[工具](cli.md#mcp-tools)）。

要在没有 MCP 服务器时保持 `codemode` 激活，把 `"defaultTools": ["+codemode"]` 添加到[设置](settings.md#tools)。要阻止自动激活 codemode，在 `mcpServers` 旁设置 `"autoEnableCodemode": false`。项目值会覆盖用户级值。当 `codemode` 和 `tool_search` 都未激活且非 direct 工具无法调用时，Pi 会警告一次。

超过 20 KB 的文本结果在到达模型时会移除中间部分，并留下一个 `…N chars truncated…` 标记。完整文本会保存到结果中给出的临时文件。Codemode 脚本收到完整结果，可以在把输出返回给模型之前缩减它。

Codemode 脚本收到完整的 MCP `CallToolResult`，包括 `content`、`structuredContent` 和 `isError`。带 `isError` 的结果在脚本内会正常 resolve，但对于直接调用会报告为错误。`image(result.content[0])` 转发一个图像块。服务器指令不属于任何工具描述；脚本用 `describeNamespace("mcp__<server>")` 读取它们，该函数也会返回服务器的工具名。

## 使用资源

当已连接的服务器提供[资源](https://modelcontextprotocol.io/specification/2025-11-25/server/resources)时，Pi 会添加 Codex 和 OpenCode 使用的资源工具：

- `list_mcp_resources` 以 JSON 列出资源：`{ server?, resources: [{ server, uri, name, ... }], nextCursor? }`。指定 `server` 时，它列出一页；`cursor` 继续下一页。不指定 `server` 时，它列出每个服务器的所有资源。
- `list_mcp_resource_templates` 列出服务器未直接列出的资源的 URI 模板。
- `read_mcp_resource` 按 `server` 和 `uri` 读取资源。文本以文本形式到达模型，图像以图像形式到达模型。其他二进制资源保存到临时文件，模型收到其路径。脚本收到 `{ server, uri, contents }`。

这些工具可访问每个已启用、未隐藏且带资源的服务器。它们的暴露方式是这些服务器中最宽的：`direct`，其次是 `codemode` 或 `deferred`。工具结果中的资源链接会标识 `read_mcp_resource` 和该服务器。

用于 MCP Apps 的资源（由 `ui://` URI 或 `text/html;profile=mcp-app` 标识）会被省略，因为 Pi 不渲染它们。资源图标也会被省略。

读取和列出资源在遇到临时 HTTP 错误（408、429 或 5xx）后会重试一次。工具调用不会重试，因为服务器可能已经执行过它们。

## 权限

每个 MCP 调用都经过 Pi 的工具流水线。因此，扩展的 `tool_call` 和 `tool_result` 处理器（包括权限门）会作用于 MCP 工具。从 codemode 脚本发起的调用会把 codemode 调用 ID 作为 `parentToolCallId` 携带。

`pi.getAllTools()` 报告每个服务器声明的注解：`readOnlyHint`、`destructiveHint`、`idempotentHint` 和 `openWorldHint`。权限扩展可以使用这些提示来决定哪些调用需要确认（见[工具暴露](../../../packages/coding-agent/docs/extensions.md#tool-exposure)）。资源工具标记为只读。

## 扩展与 SDK

### 从扩展添加服务器

扩展可以用 `pi.registerMcpServer(name, config)` 为当前会话添加服务器，其结构与 `mcpServers` 条目相同（见[扩展中的 MCP 服务器](../../../packages/coding-agent/docs/extensions.md#mcp-servers)）。注册的服务器像已配置的服务器一样连接，并在 `/mcp` 中显示，来源为该扩展。

对启用状态或暴露方式的改动只作用于当前会话。同名的文件配置服务器优先，`/mcp` 会列出被覆盖的注册。`pi mcp` shell 命令不加载扩展，只能看到文件配置的服务器。

### 替换内置 MCP 支持

已安装的扩展如果注册了 `/mcp`（例如 `pi-mcp-adapter`），会替换会话的内置 MCP 支持。此时 Pi 不再读取 `mcp.json`，也不在会话中连接其服务器，`/mcp` 归该扩展所有。移除该扩展可恢复内置行为。要在没有替代品的情况下禁用内置 MCP 支持，在 `pi config` 的 Built-in 中禁用 `mcp`，或在[设置](settings.md#resources)中设置 `"extensions": ["-builtin:mcp"]`。`--no-mcp` 在单次运行中禁用它。

注册 `codemode` 或 `tool_search` 的扩展同样会替换同名的内置工具。Pi 会为 MCP 服务器激活该替代品，并且只有当它声明了 [`reachesTools`](../../../packages/coding-agent/docs/extensions.md#tool-exposure) 时，才会等待其调用所需的服务器。shell 层面的 `pi mcp` 命令始终使用内置实现。

### 从 SDK 使用 MCP

SDK 会话不加载内置扩展。把 MCP 扩展、用于 `codemode` 服务器的 codemode 扩展，以及用于 `deferred` 服务器的工具搜索扩展添加到资源加载器。见 [Codemode 与 MCP](sdk.md#codemode-mcp)。
