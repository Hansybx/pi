> 这是简体中文译本，译自 `packages/coding-agent/docs/llama-cpp.md`。与英文原文如有出入，以原文为准。

# 使用 llama.cpp 的本地模型

Pi 支持 [llama.cpp](https://llama.app) 路由器服务器。该路由器可发现多个 GGUF 模型，并按需加载或卸载它们。

## 安装 llama.cpp

用[官方安装器](https://llama.app/docs/installation)安装 llama.cpp：

```bash
curl -LsSf https://llama.app/install.sh | sh
```

验证安装：

```bash
llama --version
```

其他安装方式（包括包管理器和从源码构建）请参阅 [llama.app](https://llama.app)。

## 启动路由器

启动 `llama serve` 时不要带 `--model`、`-m` 或 `-hf`。传入模型会启动单模型模式，而不是路由器模式。路由器的配置请参阅 [llama.cpp 服务器指南](https://llama.app/docs/serve#serving-multiple-models-router-mode)。

```bash
llama serve \
  --no-models-autoload \
  -ngl all \
  -c 32768
```

重要选项：

- `--no-models-autoload` 让加载只能通过 `/llama` 显式进行。
- `-ngl all` 把所有层卸载到 GPU。省略它会使用自动 GPU 卸载。
- `-c 32768` 以 token 为单位设置上下文大小。使用 `-c 0` 表示模型的完整上下文窗口，这可能需要多得多的内存。上下文在并行的服务器槽位之间共享。

单文件模型可以直接放在模型目录中。把多模态模型和多分片模型放在单独的子目录中：

```text
~/models/
├── llama-3.2-1b-Q4_K_M.gguf
├── gemma-3-4b-it-Q4_K_M/
│   ├── gemma-3-4b-it-Q4_K_M.gguf
│   └── mmproj-F16.gguf
└── large-model-Q4_K_M/
    ├── large-model-Q4_K_M-00001-of-00003.gguf
    ├── large-model-Q4_K_M-00002-of-00003.gguf
    └── large-model-Q4_K_M-00003-of-00003.gguf
```

手动添加文件后需重启路由器。路由器还通过 `--models-preset` 支持缓存模型和 preset 文件，如[服务器指南](https://llama.app/docs/serve#serving-multiple-models-router-mode)所述。

## 配置 Pi

启动 Pi 并配置 provider：

```text
/login llama.cpp
```

输入路由器 URL 和可选的 API key。默认 URL 是 `http://127.0.0.1:9931`。

如果你用 `--no-models-autoload` 启动路由器，`/login llama.cpp` 只保存连接信息。运行 `/llama` 加载模型，然后用 `/model` 为当前会话选择已加载的模型。

无需 `/login`，也可以用环境变量配置相同的值：

```bash
export LLAMA_BASE_URL=http://127.0.0.1:9931
export LLAMA_API_KEY=optional-secret
pi
```

如果服务器使用 API key，启动 `llama serve` 时传入匹配的 `--api-key` 值。保持 `--host 127.0.0.1` 以仅限本地访问。

## 管理模型

运行：

```text
/llama
```

- 选择一个未加载的模型即可加载它。
- 选择一个已加载的模型即可卸载它。
- 选择 **Download model…**，搜索 Hugging Face，然后选择一个仓库和量化。精确的 `owner/repository[:quant]` 值同样可用。
- 在加载或下载过程中按 Escape 以确认取消。

Hugging Face 搜索在设置了 `HF_TOKEN` 时使用它，然后依次检查 `$HF_TOKEN_PATH`、`$HF_HOME/token`、`$XDG_CACHE_HOME/huggingface/token` 和 `~/.cache/huggingface/token`。未经认证时搜索同样可用，但速率限制更低。Pi 在下载受限仓库前会发出警告，并链接到它们的访问页面。下载由 llama.cpp 服务器执行，因此当选中的仓库需要授权时，该进程也必须拥有 `HF_TOKEN`。

如果已加载其他模型，Pi 会询问是先卸载它们还是保持加载。Pi 不会静默卸载模型，也从不删除模型文件。路由器可能与其他客户端共享，因此 `/llama` 始终显示路由器的当前状态。

已加载和休眠的模型会出现在 `/model` 中。休眠的模型在被选中时会自动唤醒。启用路由器自动加载时，未加载的 preset 模型也会出现，并在被选中时加载。使用 `--no-models-autoload` 时，先通过 `/llama` 加载模型，再选择它。

如果路由器断开连接，`/llama` 会显示 **Retry** 和 **Close**。Retry 会重新连接并刷新模型状态，但不会重放被中断的操作。

## 分类

分类器模型针对 JSON 状态回答带类型的 `choice`、`bool` 和 `score` 问题，类似 TypeSafe 的 Jev 模型。模型通过 [`codemode`](cli.md#enable-codemode) 脚本访问它们，扩展则通过 `ctx.modelRegistry.classify()` 访问；参见[分类器模型](models.md#use-classifier-models)。Pi 以两种方式把 llama.cpp 模型列为分类器：

- **决策模型**（如 [Julia-1、Laya、Kev、lev 和 OpenJev](https://huggingface.co/collections/ggml-org/decision-models-6abf80cca3c83f127060a769)）通过 llama.cpp 的 `/v1/systemone` 端点原生作答。它们只作为分类器出现，使用 `typesafe-system-one` API，且不出现在 `/model` 中。
- **聊天模型**也会以相同的 ID 和 `llama-cpp-classify` API 列为分类器，该 API 按下文所述从下一个 token 的概率中读取答案。

llama.cpp 0.6.0 及更高版本会在路由器的模型列表中报告决策模型：它们的 `architecture.output_modalities` 包含 `decisions`。路由器从 GGUF 元数据读取这一信息，无需加载模型，因此 Pi 也能识别未加载和休眠的决策模型。较旧的 llama.cpp 构建不会报告该信息，Pi 会把它们的决策模型列为聊天模型。

### 作为分类器的聊天模型

模型不会生成答案。每个问题变成一个聊天提示词：状态、请求中的每个问题、再次出现的状态，然后是带有单 token 标签及其答案的问题。choice 的标签是字母（最多 62 个选项），bool 是 `Yes`/`No`，score 是数字（最多 10 个级别）。第二份状态是在问题可见的情况下读取的，这提升了小模型在 JevBench 上的准确率。Pi 读取这些标签作为下一个 token 的概率并对其归一化。choice 返回每个选项的概率以及置信度 `(n * peak - 1) / (n - 1)`；score 返回期望的级别。

- 原始标签概率通常过度自信。按请求的 `temperature` 选项会在归一化前除掉标签 logits；大于 1 的值会柔化分布。它不会改变任何答案。
- 问题按顺序依次执行。最终问题之前的全部内容对该请求的所有问题都相同，因此服务器的提示缓存只计算一次。状态出现两次，因此它需要两倍的上下文空间。
- 小模型可能遵循写在状态里的指令。提示词要求模型把状态当作数据来判断，但这并非保证。
- 像 Qwen3.5 这样的混合模型没有上下文检查点时无法回退部分缓存的提示词。如果每个问题都要重新处理整个状态，请用 `--ctx-checkpoints 32 --checkpoint-min-step 0` 启动路由器。

## 故障排查

检查路由器是否可达：

```bash
curl http://127.0.0.1:9931/health
curl http://127.0.0.1:9931/models
```

- **`/llama` 中没有模型：**检查 `--models-dir`、目录布局，并重启路由器。
- **使用 `--no-models-autoload` 时 `/model` 中缺少模型：**先用 `/llama` 加载它。
- **加载失败或占用内存过多：**调低 `-c` 或卸载另一个模型。
- **服务器未处于路由器模式：**启动时不要带 `--model`、`-m` 或 `-hf`。

要移除 `llama.cpp` provider 和 `/llama`，在 `pi config` 的 Built-in 下禁用 `llama.cpp`，或在[设置](settings.md#resources)中设置 `"extensions": ["-builtin:llama.cpp"]`。
