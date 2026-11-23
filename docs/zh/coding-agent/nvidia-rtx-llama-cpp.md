> 这是简体中文译本，译自 `packages/coding-agent/docs/nvidia-rtx-llama-cpp.md`。与英文原文如有出入，以原文为准。

# 使用 NVIDIA RTX 和 llama.cpp 运行 Pi

[NVIDIA Local AI Inference Recipes](https://nvidia.github.io/local-ai-inference-recipes/index.html) 提供针对特定 NVIDIA 硬件和模型调优的 llama.cpp 设置。每条 recipe 给出一个单模型的 `llama-server` 命令。Pi 使用 llama.cpp 路由器，它可以提供并管理多个模型，因此本指南把 recipe 命令转换成路由器 preset，并用 `llama serve` 启动它。`llama serve` 接受与 `llama-server` 相同的选项。

以下示例使用 Windows PowerShell。Pi 完整的路由器与模型管理参考请参阅[使用 llama.cpp 的本地模型](llama-cpp.md)。

## 开始之前

1. 打开 [recipe 目录](https://nvidia.github.io/local-ai-inference-recipes/index.html)，选择你的硬件、操作系统和模型，然后选择 **llama.cpp**。检查前提条件和内存要求。保留下 recipe 的启动命令，用于下面的转换。
2. 按 recipe 的安装说明安装 llama.cpp。recipe 的设置取决于其构建，例如 CUDA 支持或推测解码选项。
3. 运行 `llama serve --help`，确认它列出了 `--models-preset`。如果该构建没有 `llama` 程序或缺少该选项，它就无法把 recipe 作为路由器 preset 加载。请使用仍满足 recipe 要求的更新构建。
4. 按[快速开始](quickstart.md)安装 Pi。在原生 Windows 上，另请参阅[在 Windows 上运行 Pi](windows.md)。

## 将 recipe 转换为 preset

preset 列出一个或多个模型的设置。每个 section 名称会成为 Pi 中显示的模型 ID。把 preset 保存在 llama.cpp 文件夹中，或在启动路由器时传入其完整路径。

把 recipe 命令中的每个选项转换成一行 preset：

- 去掉前导的短横线：`--ctx-size 65536` 变成 `ctx-size = 65536`。
- 没有值的选项写为 `true`：`--jinja` 变成 `jinja = true`。
- 去掉值周围的引号和 PowerShell 的续行反引号。
- 省略 `--host` 和 `--port`。它们属于路由器命令行。
- 添加 `load-on-startup = true`，让路由器在启动时加载模型。
- 把模型文件的短选项替换成对应的长 preset 键：

| recipe 选项 | preset 键 |
|---|---|
| `-hf` | `hf-repo` |
| `-hff` | `hf-file` |
| `-hfrd` | `hf-repo-draft` |
| `--spec-draft-model` | `spec-draft-model` |

例如，这条 recipe 命令：

```powershell
llama-server.exe -hf "unsloth/Qwen3.8-27B-GGUF" `
  -hff "Qwen3.8-27B-UD-Q4_K_M.gguf" `
  -hfrd "z-lab/Qwen3.8-27B-DFlash2-GGUF" `
  --spec-draft-model "Qwen3.8-27B-DFlash2-Q4_K_M.gguf" `
  --no-mmproj `
  --host 127.0.0.1 `
  --port 9931 `
  --batch-size 4096 `
  --ubatch-size 1024 `
  --ctx-size 65536 `
  --parallel 1 `
  -ngl 999 `
  --jinja `
  --chat-template-kwargs '{"preserve_thinking":true}' `
  --spec-type draft-dflash `
  --spec-draft-n-max 7 `
  --spec-draft-backend-sampling
```

就会变成 `qwen3.8-27b.ini`：

```ini
version = 1

[qwen3.8-27b]
load-on-startup = true
hf-repo = unsloth/Qwen3.8-27B-GGUF
hf-file = Qwen3.8-27B-UD-Q4_K_M.gguf
hf-repo-draft = z-lab/Qwen3.8-27B-DFlash2-GGUF
spec-draft-model = Qwen3.8-27B-DFlash2-Q4_K_M.gguf
no-mmproj = true
batch-size = 4096
ubatch-size = 1024
ctx-size = 65536
parallel = 1
ngl = 999
jinja = true
chat-template-kwargs = {"preserve_thinking":true}
spec-type = draft-dflash
spec-draft-n-max = 7
spec-draft-backend-sampling = true
```

## 启动路由器

在 llama.cpp 文件夹中打开 PowerShell 并运行：

```powershell
.\llama.exe serve --models-preset qwen3.8-27b.ini --host 127.0.0.1
```

如果 recipe 需要 Hugging Face token，请在启动路由器前在同一个 PowerShell 窗口中设置 `$env:HF_TOKEN`。首次启动时，路由器会下载模型文件。

使用[路由器健康检查](llama-cpp.md#troubleshooting)确认服务器已就绪。在 Windows PowerShell 中，请使用 `curl.exe` 而不是 `curl`，因为 PowerShell 会把 `curl` 映射到另一个命令。当 `/models` 列出 `qwen3.8-27b` 且状态为 `loaded` 时，模型已就绪。

## 在 Pi 中使用该模型

按照[配置 Pi](llama-cpp.md#configure-pi) 操作，并连接到 `http://127.0.0.1:9931`。preset 的 section 名称就是模型 ID，因此在本示例中请在 `/model` 中选择 `qwen3.8-27b`。

NVIDIA recipe 的内存设置假定只有选中的模型使用 GPU。如果 `/llama` 显示其他已加载的模型，请在使用 recipe 模型前卸载它们。
