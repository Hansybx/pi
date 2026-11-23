> 这是简体中文译本，译自 `packages/coding-agent/docs/providers.md`。与英文原文如有出入，以原文为准。

# Provider

大多数托管 provider 支持以下认证方法中的一种或两种：

- 通过基于 OAuth 的浏览器或设备流程登录。
- 提供 API key。

使用 `/login [provider]` 查看某个 provider 支持的方法。Amazon Bedrock 和 Google Vertex AI 还可以使用环境提供的云凭证。

## 交互式认证

运行 `/login` 并选择一个 provider。Pi 会引导你完成它的 OAuth 或 API key 流程，并把生成的凭证保存到 [`auth.json`](configuration.md#agent-directory)。

在远程或无头机器上，OAuth 回调可能无法到达本地进程。出现提示时，把最终的跳转 URL 或授权码粘贴回 Pi。

运行 `/logout` 并选择一个 provider 可以删除其存储的凭证。这不会取消设置环境变量，不会移除 `models.json` 中的认证，也不会在 provider 侧吊销该凭证。

`auth.json` 可能包含 API key 和 OAuth token。请妥善保管，不要提交。

## 从环境变量使用 API key

环境变量在 CI 以及任何不希望 Pi 存储 key 的场景中很有用。在启动 Pi 之前设置该变量：

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pi
```

下表列出只使用一个主要 API key 变量的 provider。需要额外配置或支持环境凭证的 provider 在 [Provider 专属配置](#provider-specific-config) 中介绍。

| provider | 环境变量 |
|---|---|
| Anthropic | `ANTHROPIC_API_KEY` |
| Ant Ling | `ANT_LING_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| DeepSeek | `DEEPSEEK_API_KEY` |
| NVIDIA NIM | `NVIDIA_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN` |
| Mistral | `MISTRAL_API_KEY` |
| Groq | `GROQ_API_KEY` |
| Cerebras | `CEREBRAS_API_KEY` |
| xAI | `XAI_API_KEY` |
| OpenRouter | `OPENROUTER_API_KEY` |
| Vercel AI Gateway | `AI_GATEWAY_API_KEY` |
| ZAI Coding Plan（全球） | `ZAI_API_KEY` |
| ZAI Coding Plan（中国） | `ZAI_CODING_CN_API_KEY` |
| OpenCode Zen and Go | `OPENCODE_API_KEY` |
| Radius | `RADIUS_API_KEY` |
| TypeSafe（[分类器模型](models.md#use-classifier-models)） | `TYPESAFE_API_KEY` |
| Hugging Face | `HF_TOKEN` |
| Fireworks | `FIREWORKS_API_KEY` |
| Together AI | `TOGETHER_API_KEY` |
| Baseten | `BASETEN_API_KEY` |
| Kimi For Coding | `KIMI_API_KEY` |
| Meta | `META_API_KEY` |
| MiniMax | `MINIMAX_API_KEY` |
| MiniMax（中国） | `MINIMAX_CN_API_KEY` |
| Moonshot AI（全球与中国） | `MOONSHOT_API_KEY` |
| Qwen Token Plan Team | `QWEN_TOKEN_PLAN_TEAM_API_KEY` |
| Qwen Token Plan Team（中国） | `QWEN_TOKEN_PLAN_TEAM_CN_API_KEY` |
| Qwen Token Plan Individual | `QWEN_TOKEN_PLAN_INDIVIDUAL_API_KEY` |
| Qwen Token Plan Individual（中国） | `QWEN_TOKEN_PLAN_INDIVIDUAL_CN_API_KEY` |
| Xiaomi MiMo | `XIAOMI_API_KEY` |
| Xiaomi MiMo Token Plan（中国） | `XIAOMI_TOKEN_PLAN_CN_API_KEY` |
| Xiaomi MiMo Token Plan（阿姆斯特丹） | `XIAOMI_TOKEN_PLAN_AMS_API_KEY` |
| Xiaomi MiMo Token Plan（新加坡） | `XIAOMI_TOKEN_PLAN_SGP_API_KEY` |

Anthropic 还识别 `ANTHROPIC_OAUTH_TOKEN` 作为 API 凭证，以及 `ANTHROPIC_AUTH_TOKEN` 作为 bearer 认证。

在未设置 key 或 token 时，只要设置了 `ANTHROPIC_FEDERATION_RULE_ID`、`ANTHROPIC_ORGANIZATION_ID` 和 `ANTHROPIC_IDENTITY_TOKEN_FILE`，Anthropic 就会使用工作负载身份联合：Anthropic SDK 用身份 token 换取短期的访问 token 并自行刷新（会重新读取身份 token 文件，因此在长时间会话中要保持该文件是最新的）。`ANTHROPIC_SERVICE_ACCOUNT_ID` 和 `ANTHROPIC_WORKSPACE_ID` 在设置后会被透传。

## 通过命令加载 API key

要想使用密钥管理器又不把解析出的 key 写到磁盘，可以把 `auth.json` 中某个 provider 的 `key` 设为一个以 `!` 为前缀的命令：

```json
{
  "anthropic": {
    "type": "api_key",
    "key": "!security find-generic-password -ws 'anthropic'"
  }
}
```

Pi 在首次需要该 key 时运行该命令，并在进程生命周期内缓存其标准输出。输出为空、超时或退出码非零时，key 会保持未解析状态，直到 Pi 重启。

<a id="provider-specific-config"></a>

## Provider 专属配置

下面的 provider 需要额外的设置、需要额外的配置项，或者可以使用其平台提供的凭证。

存储的 API key 凭证可以包含一个 `env` 对象。对于该 provider，其中的值优先于进程环境：

```json
{
  "cloudflare-workers-ai": {
    "type": "api_key",
    "key": "...",
    "env": {
      "CLOUDFLARE_ACCOUNT_ID": "account-id"
    }
  }
}
```

### Radius

Radius 是由 Pi 的开发者 Earendil Works 为 Pi 打造的服务。它提供一个可定制的 AI 网关，内置组织级控制与分析，以及用于分享你用 Pi 创作的内容的 artifacts。

要开始使用，请在 Pi 中运行 `/login radius`。这会把 Radius 添加为一个 provider，其模型会像其他任何 provider 的模型一样出现在 `/model` 中。

Radius 还提供 MCP 服务器，因此 Pi 可以替你管理 Radius。

Radius 目前处于早期 alpha 阶段，变化很快。更多信息见 [radius.earendil.com](https://radius.earendil.com)。

Radius 认证使用其网关目录，并缓存刷新后的模型元数据，以便之后离线启动。在 `models.json` 中配置的自定义 Radius 网关使用自己的目录，而不会继承公共的 `radius.pi.dev` 目录。

### OpenRouter

使用 `/login openrouter` 或 `OPENROUTER_API_KEY` 进行认证。

提供 key 时，Pi 只列出该 key 可以使用的 OpenRouter 聊天模型，并附带该 key 的上下文大小、最大输出和价格。这些信息来自 OpenRouter 的 `/models/user` 端点，反映了在 OpenRouter 中设置的护栏和 provider 限制。图像模型和分类器模型不会被过滤。

Pi 会在以下时机在后台刷新该列表：交互模式启动时、打开 `/model` 时、`/login` 之后，以及执行 `pi update --models` 时。最近一次的列表会被保存，并在离线时以及 `pi -p` 和 RPC 模式中使用。在 `/login` 之外切换 key 后，上一个 key 的列表会保留到下一次刷新。

区域端点会把模型过滤到其所在区域。要使用其中之一，请在 [`models.json`](models.md#configure-a-compatible-endpoint) 中设置 base URL：

```json
{
  "providers": {
    "openrouter": { "baseUrl": "https://us.openrouter.ai/api/v1" }
  }
}
```

如果该 base URL 在 `/models/user` 拒绝此 key，或者没有该端点（例如把代理配置成 OpenRouter 的 base URL），Pi 会列出所有 OpenRouter 模型。

### Azure OpenAI

provider ID 是 `azure`（原为 `azure-openai-responses`）。在 `auth.json`、`models.json` 和 `settings.json` 中把它用作键，也用于诸如 `--model azure/gpt-5.4` 这样的模型引用。

`azure` provider 通过 Responses API 提供 OpenAI 模型，通过 Chat Completions 提供 Microsoft Foundry 模型，例如 `azure/deepseek-v4-pro`。

设置 API key，并设置 base URL 或资源名之一：

```bash
export AZURE_OPENAI_API_KEY=...
export AZURE_OPENAI_BASE_URL=https://your-resource.ai.azure.com
# Or:
export AZURE_OPENAI_RESOURCE_NAME=your-resource
```

`ai.azure.com`、`cognitiveservices.azure.com` 和 `openai.azure.com` 下的资源根 URL 会被规范化为 OpenAI API 路径。

Pi 会把模型 ID 作为部署名发送。如果某个部署的名称不同，用 `AZURE_OPENAI_DEPLOYMENT_NAME_MAP` 做映射：

```bash
export AZURE_OPENAI_DEPLOYMENT_NAME_MAP=gpt-5.4=my-gpt-deployment,deepseek-v4-pro=my-deepseek
```

`AZURE_OPENAI_API_VERSION` 会覆盖 OpenAI 模型的 API 版本（默认 `v1`）。

要使用 Pi 未包含的 Foundry 模型，请在 [`models.json`](models.md#configure-a-compatible-endpoint) 的 `azure` 下添加它，并设置 `api: "openai-completions"`。自定义模型需要 `baseUrl`；当设置了 `AZURE_OPENAI_BASE_URL` 和 `AZURE_OPENAI_RESOURCE_NAME` 时，它们优先于 `baseUrl`：

```json
{
  "providers": {
    "azure": {
      "baseUrl": "https://your-resource.services.ai.azure.com",
      "models": [
        { "id": "your-deployment", "api": "openai-completions" }
      ]
    }
  }
}
```

### Amazon Bedrock

Bedrock 可以使用 bearer token 或环境提供的 AWS 凭证来源：

```bash
# Named profile
export AWS_PROFILE=your-profile

# IAM keys
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
# Required for temporary credentials
export AWS_SESSION_TOKEN=...

# Bedrock bearer token
export AWS_BEARER_TOKEN_BEDROCK=...

# Region, when not supplied by the profile or AWS SDK configuration
export AWS_REGION=us-west-2
# AWS_DEFAULT_REGION is also supported
```

Pi 还通过标准的 `AWS_CONTAINER_CREDENTIALS_*` 和 `AWS_WEB_IDENTITY_TOKEN_FILE` 变量支持 ECS 任务凭证和 IRSA。

### Cloudflare AI Gateway

该网关需要 token、账户 ID 和网关 ID：

```bash
export CLOUDFLARE_API_KEY=...
export CLOUDFLARE_ACCOUNT_ID=...
export CLOUDFLARE_GATEWAY_ID=...
```

账户 ID 和网关 ID 可以来自进程环境，也可以来自 `auth.json` 中凭证的 `env` 对象。

`CLOUDFLARE_API_KEY` 用于向网关认证 Pi。上游访问可以使用 Cloudflare 统一计费、存储在网关中的凭证，或是在 `models.json` 中为该 provider 配置的 `Authorization` 头。

### Cloudflare Workers AI

Workers AI 需要 token 和账户 ID：

```bash
export CLOUDFLARE_API_KEY=...
export CLOUDFLARE_ACCOUNT_ID=...
```

账户 ID 也可以存储在凭证的 `env` 对象中。

### Google Vertex AI

使用 Google Cloud API key：

```bash
export GOOGLE_CLOUD_API_KEY=...
```

要使用应用默认凭证，请配置项目和位置：

```bash
export GOOGLE_CLOUD_PROJECT=your-project
# GCLOUD_PROJECT is also supported
export GOOGLE_CLOUD_LOCATION=us-central1
```

然后进行认证：

```bash
gcloud auth application-default login
```

如果要改用服务账号密钥文件，请设置 `GOOGLE_APPLICATION_CREDENTIALS` 以及项目和位置。
