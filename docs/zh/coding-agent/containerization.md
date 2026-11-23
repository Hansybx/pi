> 这是简体中文译本，译自 `packages/coding-agent/docs/containerization.md`。与英文原文如有出入，以原文为准。

# 在隔离环境中运行 Pi

使用隔离环境来限制生成的命令可以访问或影响的文件、凭证、进程和网络服务。

你可以隔离整个 Pi 进程，也可以把 Pi 留在宿主机上，并将选定的工具路由到隔离环境中。

## 选择隔离方式

| 方式 | Pi 的运行位置 | 被隔离的内容 | 凭证处理 | 最适合 |
|---|---|---|---|---|
| 纯 Docker | 容器 | Pi、内置工具、`!` 命令和扩展 | 传入容器的凭证 | 直接的本地容器边界 |
| Docker Sandboxes | 托管的沙箱 | Pi、内置工具、`!` 命令和扩展 | provider（提供商）凭证留在宿主机上，由代理替换 | 不暴露真实 provider 密钥的托管本地隔离 |
| OpenShell | 本地或远程沙箱 | Pi、内置工具、`!` 命令和扩展 | 由策略控制的凭证和推理路由 | 文件系统、进程、网络和凭证策略 |
| Gondolin 扩展 | 宿主机 | 内置工具和 `!` 命令 | 存储的 Pi 凭证留在宿主机上，但命令继承宿主机的环境变量 | 用于执行工具的本地 micro-VM，同时保留宿主机界面 |

这些方式改变的是扩展的运行位置。当整个 Pi 进程在隔离环境中运行时，它的扩展也在那里运行。当宿主机上的 Pi 通过 Gondolin 委派内置工具时，其他扩展工具仍在宿主机上运行，除非它们也委派自己的工作。

## 决定 Pi 可以访问什么

隔离的进程仍可能影响你向它暴露的资源：

- 读写的宿主机挂载会让 Pi 修改那些宿主机文件。
- 挂载 `~/.pi/agent` 会暴露你的 Pi 凭证、设置、扩展和会话。
- 传入容器的环境变量对容器内的进程可用。
- 网络访问可能让代码或工具输出离开该环境。
- 仅隔离工具不会约束宿主机上的 Pi 进程，也不会约束不使用隔离后端的扩展工具。

只暴露任务所需的工作文件夹、凭证和网络目标。当你不希望写入影响宿主机时，使用只读挂载，或把文件复制进和复制出该环境。

## 在纯 Docker 中运行 Pi

纯 Docker 提供最简单的整进程容器边界。

### 构建镜像

创建 `Dockerfile.pi`：

```dockerfile
FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates git ripgrep \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g --ignore-scripts @earendil-works/pi-coding-agent

WORKDIR /workspace
ENTRYPOINT ["pi"]
```

在包含该文件的目录中构建它：

```bash
docker build -t pi-sandbox -f Dockerfile.pi .
```

### 启动 Pi

在你希望 Pi 访问的工作文件夹中运行：

```bash
docker run --rm -it \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  -v pi-agent-home:/root/.pi/agent \
  pi-sandbox
```

把 `ANTHROPIC_API_KEY` 替换为你的 provider 所需的凭证。名为 `pi-agent-home` 的卷会在多次运行之间保留容器内的设置、凭证和会话。

除非容器应当访问你在宿主机上的 Pi 配置和凭证，否则不要挂载宿主机的 `~/.pi/agent`。

### 验证工作区

在 Pi 内部运行：

```text
!pwd
```

该命令应报告 `/workspace`。对 `/workspace` 下文件的改动会写入挂载的宿主机文件夹。当这不可接受时，移除该绑定挂载或改用只读挂载。

## 使用 Docker Sandboxes 运行 Pi

[Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) 在托管沙箱中运行整个 Pi 进程。它的代理可以把真实的 provider 凭证留在宿主机上，并在请求离开沙箱时替换它。

在创建沙箱前配置凭证。不要在沙箱内运行 `/login`，因为那会把真实凭证写入其中。

### 使用 Claude Pro 或 Max token

在有 Claude Code 的机器上用 `claude setup-token` 生成 token。如果已经配置了 `anthropic` secret，请先移除它，这样代理就不会在 bearer token 之外再加一个 API key 请求头：

```bash
sbx secret rm anthropic

sbx secret set-custom \
  --host api.anthropic.com \
  --env ANTHROPIC_OAUTH_TOKEN \
  --placeholder 'sk-ant-oat01-{rand}'
```

`sbx secret set-custom` 从标准输入读取真实 token。沙箱收到的是 OAuth 形态的占位符，代理只在请求发往已配置的宿主机时替换它。

若使用 Anthropic API key，请改用 `sbx secret set anthropic`。

### 启动 Pi

在你希望挂载的工作文件夹中运行：

```bash
sbx run --kit "docker.io/sbx/pi-kit:latest" pi
```

对于已有的沙箱，用以下命令以非交互方式运行 Pi：

```bash
sbx exec <sandbox-name> -- pi -p "list the failing tests"
```

其他 provider、故障排查和镜像固定请参阅 [Pi kit 文档](https://github.com/docker/sbx-kits-contrib/tree/main/pi)。

## 使用 OpenShell 运行 Pi

[NVIDIA OpenShell](https://docs.nvidia.com/openshell/about/overview) 提供本地或远程沙箱，并带有文件系统、进程、网络、凭证和推理策略。

### 选择一个网关

每个沙箱都需要一个可用的网关：

```bash
openshell gateway add <gateway-url> --name <name>
openshell gateway select <name>
```

### 创建沙箱

```bash
openshell sandbox create --name pi-sandbox --from pi -- pi
```

Pi、它的内置工具、`!` 命令和扩展工具都在 OpenShell 边界内运行。

### 向远程沙箱传输文件

远程网关不会绑定挂载你的宿主机工作文件夹。请在沙箱内克隆仓库，或显式传输文件：

```bash
openshell sandbox upload pi-sandbox ./working-folder /workspace
openshell sandbox download pi-sandbox /workspace/working-folder ./working-folder-out
```

OpenShell 的推理路由可以把原始模型凭证留在沙箱之外。配置后，把 Pi 指向网关暴露的相应 OpenAI 兼容或 Anthropic 兼容端点。

## 通过 Gondolin 路由工具

[Gondolin](https://github.com/earendil-works/gondolin) 是一个本地 Linux micro-VM。它的示例扩展把 Pi 进程和基于文件的 provider 凭证留在宿主机上，同时把内置工具和用户 `!` 命令路由到 VM 中。

VM 内的命令继承宿主机进程的环境变量。因此通过环境变量提供的 provider 密钥在 VM 内可能可见。除非你移除敏感变量或修改扩展的环境变量处理方式，否则不要把这种模式当作凭证边界。

Gondolin 需要 Node.js 23.6 或更高版本，以及通过操作系统包管理器安装的 QEMU。

### 安装扩展

在 Pi 源码检出目录中：

```bash
mkdir -p ~/.pi/agent/extensions
cp -R packages/coding-agent/examples/extensions/gondolin ~/.pi/agent/extensions/gondolin
cd ~/.pi/agent/extensions/gondolin
npm install --ignore-scripts
```

### 启动 Pi

在你希望挂载的工作文件夹中运行 Pi：

```bash
cd /path/to/working-folder
pi -e ~/.pi/agent/extensions/gondolin
```

该扩展把宿主机工作文件夹挂载到 VM 中的 `/workspace`，并覆盖 `read`、`write`、`edit`、`bash`、`grep`、`find` 和 `ls`。`/workspace` 下的文件改动会写回宿主机。

其他扩展工具仍在宿主机上运行，除非它们显式委派自己的操作。在添加可能绕过 VM 边界的工具之前，先查看 [Gondolin 示例](../../../packages/coding-agent/examples/extensions/gondolin/)。
