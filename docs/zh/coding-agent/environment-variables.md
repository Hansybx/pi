> 这是简体中文译本，译自 `packages/coding-agent/docs/environment-variables.md`。与英文原文如有出入，以原文为准。

# 环境变量

Pi 以三种方式使用环境变量：

- 诸如 `PI_OFFLINE` 的变量用于配置 Pi 进程。
- Pi 设置进程标记，使子进程能识别 Pi 是启动它的 agent。
- 由 LLM 可调用的 shell 工具运行的命令会收到描述当前会话的 `PI_*` 变量。

provider 的 API key 变量在 [provider](providers.md#use-an-api-key-from-the-environment) 中单独说明。

## 进程标记

CLI 与 RPC 入口会设置两个进程标记：

- `AI_AGENT=pi` 是通用标记，让工具能识别 Pi 是启动该进程的 agent。
- `PI_CODING_AGENT=true` 是 Pi 专用标记，让子进程检测到自己在 Pi 内运行。

子进程会继承这两个标记。它们不针对特定会话，并且在通过 SDK 嵌入 Pi 时不会自动设置。

## Shell 工具的会话环境

由 `bash` 与 `powershell` 工具运行的命令会收到当前 Pi 会话状态：

| 变量 | 描述 |
|----------|-------------|
| `PI_SESSION_ID` | 当前会话 ID |
| `PI_SESSION_FILE` | 当前会话 JSONL 文件的绝对路径；临时会话不设置该变量 |
| `PI_PROVIDER` | 当前选择的模型 provider |
| `PI_MODEL` | 当前选择的模型 ID |
| `PI_REASONING_LEVEL` | 当前生效的推理级别：`off`、`minimal`、`low`、`medium`、`high`、`xhigh` 或 `max` |

这些值在每条命令启动时解析。因此切换模型或更改推理级别会影响下一条 shell 命令，而无需重启 Pi。`PI_PROVIDER` 与 `PI_MODEL` 标识所选的 Pi 模型，而非路由器可能在内部选择的其他上游模型。

当被问及正在运行哪个模型或 provider 时，请检查这些变量，而不要从系统提示词推断：

```bash
printf '%s/%s\n' "$PI_PROVIDER" "$PI_MODEL"
printf 'reasoning=%s session=%s\n' "$PI_REASONING_LEVEL" "$PI_SESSION_ID"
```

会话持久化时，可以直接检查会话文件：

```bash
if [ -n "$PI_SESSION_FILE" ]; then
  tail -n 1 "$PI_SESSION_FILE"
fi
```

这些变量会注入 LLM 可调用的 `bash` 与 `powershell` 工具。它们不会注入用户输入的 `!` 或 `!!` 命令。

### 自定义 Shell 工具

用 `createBashTool()` 或 `createPowerShellTool()` 创建的工具在注册到 Pi 时默认暴露会话环境。注入发生在 `spawnHook` 之前，因此 hook 可以在 `ctx.env` 中收到这些变量：

```typescript
const bashTool = createBashTool(cwd, {
  spawnHook: (ctx) => ({
    ...ctx,
    env: { ...ctx.env, CI: "1" },
  }),
});
```

可以独立于 spawn hook 禁用会话元数据：

```typescript
const powershellTool = createPowerShellTool(cwd, {
  exposeSessionEnvironment: false,
  spawnHook: (ctx) => ctx,
});
```

禁用后，Pi 会移除这些变量的继承值，使嵌套的 Pi 进程不会暴露过期的父会话元数据。

## Pi 进程配置

这些变量由 Pi 自身读取：

| 变量 | 描述 |
|----------|-------------|
| `PI_CODING_AGENT_DIR` | 覆盖配置目录；默认为 `~/.pi/agent` |
| `PI_CODING_AGENT_SESSION_DIR` | 覆盖会话存储位置；会被 `--session-dir` 覆盖 |
| `PI_PACKAGE_DIR` | 覆盖包目录，适用于 Nix/Guix store 路径 |
| `PI_OFFLINE` | 禁用自动网络活动，包括模型目录刷新 |
| `PI_SKIP_VERSION_CHECK` | 禁用 `pi.dev` 最新版本请求 |
| `PI_SELF_UPDATE_COMMAND` | `pi update` 用于更新 Pi 自身的命令，按空白字符拆分，支持 `{packageName}`、`{version}` 与 `{installSpec}` 占位符。优先于 `selfUpdateCommand` 设置。参见 [自定义更新命令](cli.md#custom-update-command) |
| `PI_TELEMETRY` | 覆盖安装/更新遥测与 provider 归属头：`1`/`true`/`yes` 或 `0`/`false`/`no` |
| `PI_CODEMODE_MAX_WORKERS` | 该进程内所有会话中同时存活的 codemode worker 上限；默认 `2`。每个 worker 的脚本最多可使用 256 MB。当一个进程运行多个会话（例如进程内子 agent）时可提高该值。更多的脚本会等待空闲 worker。参见 [Codemode](codemode.md) |
| `PI_CACHE_RETENTION` | 在受支持时设为 `long` 以延长 provider 提示词缓存 |
| `PI_SHARE_VIEWER_URL` | 覆盖 `/share` 使用的基准 URL |
| `PI_RADIUS_GATEWAY` | 覆盖 `/bug` 上传使用的 Radius 网关 origin |
| `PI_CLEAR_ON_SHRINK` | 设为 `1` 以在渲染内容缩短时清除空行；`terminal.clearOnShrink` 设置优先。参见 [设置](settings.md) |
| `PI_HARDWARE_CURSOR` | 设为 `1` 以显示硬件光标；参见 [终端设置](terminal-setup.md) |
| `PI_CLIPBOARD_OSC52` | 设为 `1` 以在写入本地剪贴板后，再用 OSC 52 将复制的文本发送到终端，就像 Pi 在 SSH 环境下所做的那样。当远程客户端在缺少 SSH 变量时访问 Pi，例如从另一台机器接入的 multiplexer 或远程 IDE daemon，可使用它 |
| `PI_HYPERLINKS` | 用 `1`、`0` 或 `auto` 覆盖 OSC 8 超链接检测 |
| `PI_PROGRAM_STATUS` | 覆盖 OSC 7501 程序状态检测：`1` 总是上报，`0` 从不上报；否则 Pi 仅在终端确认支持后上报。参见 [终端设置](terminal-setup.md#program-status) |
| `PI_IMAGE_PROTOCOL` | 用 `kitty`、`iterm2`、`none` 或 `auto` 覆盖内联图片检测 |
| `PI_TRUE_COLOR` | 用 `1`、`0` 或 `auto` 覆盖真彩色检测 |
| `PI_TUI_ESC_TIMEOUT` | 单个 ESC 之后等待多久才将其视为 Escape，单位为毫秒；SSH 环境下默认为 `100`，其他情况为 `10`。若 Alt 键输入被误判为 Escape，可增大该值 |
| `VISUAL`, `EDITOR` | `externalEditor` 未设置时的外部编辑器回退 |
| `HTTP_PROXY`, `HTTPS_PROXY` | 代理出站 HTTP 请求 |

诸如 `ANTHROPIC_API_KEY`、`OPENAI_API_KEY` 的 provider 凭证以及 provider 专属配置列在 [provider](providers.md#use-an-api-key-from-the-environment) 中。