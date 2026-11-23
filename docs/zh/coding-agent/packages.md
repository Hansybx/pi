> 这是简体中文译本，译自 `packages/coding-agent/docs/packages.md`。与英文原文如有出入，以原文为准。

# Pi 包

Pi 包把扩展、技能、提示模板和主题作为一个单元安装和分发。当某项定制需要通过 npm 或 git 共享，或多个资源属于同一整体时，使用包。

包就是一个普通目录或 npm 包。它可以暴露约定俗成的资源目录，在 `package.json` 的 `pi` 键下声明显式路径，并携带自己的运行时依赖。

## 安装和管理包

从 npm、git 或本地路径安装：

```bash
pi install npm:@example/pi-tools@1.0.0
pi install git:github.com/example/pi-tools@v1
pi install ./local-package
```

`pi list` 显示已配置的包。用 `pi remove <source>` 移除一个包，用 `pi update --extensions` 核对包安装。所有包命令和选项见[命令行](cli.md#package-commands)。

如果已配置的包在启动时安装失败（例如 npm 无法访问注册表），Pi 会给出警告，跳过该包的资源，并继续运行。Pi 会在下次启动或 `/reload` 时再次尝试安装。`pi install` 和 `pi update --extensions` 仍会报告该失败并以非零状态退出。

个人安装写入 `~/.pi/agent/settings.json`。加上 `--local` 或 `-l` 可把包声明写入 `.pi/settings.json`。只有授予项目信任后，Pi 才会从该文件读取声明。

项目包只有在项目信任解决之后才会安装和加载。包可以执行扩展代码，也可以包含指示模型运行程序的技能。安装第三方包之前请审查其源码。授予项目信任之前请审查项目包声明。

使用 `--extension` 或 `-e` 可以在单次调用中试用一个包，而不把它加入设置：

```bash
pi -e npm:@example/pi-tools
```

Pi 把 `-e` 包缓存到 `~/.pi/agent/tmp/extensions/` 下，并在每次启动和 `/reload` 时检查它们。当注册表中有比声明更新的匹配版本时，npm 包会被重新安装。固定到精确版本号（例如 `@1.2.3`）的版本不会被检查。git 包会被拉取并重置到远程分支或 ref。如果某个 ref 是已检出的提交哈希，则不会被拉取。如果检查失败或处于离线模式，Pi 加载缓存的副本。

## 选择来源

| 来源 | 示例 | 行为 |
|---|---|---|
| npm | `npm:@example/pi-tools@1.0.0` | 安装在 Pi 的 npm 目录下 |
| git | `git:github.com/example/pi-tools@v1` | 克隆并核对到选定的 ref |
| URL | `https://github.com/example/pi-tools` | 视为 git 来源 |
| 本地 | `./pi-tools` | 从解析后的路径加载，不复制 |

带版本号的 npm 声明是固定的。git 标签和提交也是固定的；包更新会核对检出内容，但不会移动已配置的 ref。

相对本地路径相对于包含它的设置文件解析。文件路径加载一个扩展。目录遵循常规的包发现规则。

## 创建包

最简单的包使用约定目录：

```text
my-pi-package/
├── package.json
├── extensions/
├── skills/
├── prompts/
└── themes/
```

没有 `pi` 清单时，Pi 会从这些目录中发现 TypeScript 和 JavaScript 扩展、技能目录、Markdown 提示和 JSON 主题。

当资源位于其他位置或需要过滤时，使用显式清单：

```json
{
  "name": "my-pi-package",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./src/extension.ts"],
    "skills": ["./resources/skills"],
    "prompts": ["./resources/prompts/*.md"],
    "themes": ["./resources/themes/*.json"]
  }
}
```

路径相对于包的根目录。数组接受 glob 模式和排除项。当通过 glob 遍历无法发现以点开头或符号链接的资源根目录时，请直接列出它们。

`pi-package` 关键字使 npm 包有资格被 [Pi 包画廊](https://pi.dev/packages)发现。可选的 `pi.image` 和 `pi.video` 字段用于添加画廊预览。

## 显示变更日志

包更新之后，Pi 可以显示有哪些变化。在下次全新启动时，Pi 读取包的变更日志，并在“Extension Updates”下显示比上次见到的版本更新的条目，方式与其显示自身变更日志相同。Pi 第一次见到某个包时，只记录版本而不显示任何内容。

这适用于至少加载一个扩展的包。只提供技能、提示模板或主题的包不会显示变更日志。

默认情况下 Pi 从包根目录读取 `CHANGELOG.md`。把 `pi.changelogPath` 指向包内另一个文件，或设为 `""` 以禁用变更日志：

```json
{
  "name": "my-pi-package",
  "version": "1.2.0",
  "pi": {
    "changelogPath": "./docs/CHANGELOG.md"
  }
}
```

使用与 Pi 变更日志相同格式的版本标题，例如 `## [1.2.0]` 或 `## 1.2.0 - 2026-01-01`。条目会与 `package.json` 中的 `version` 字段匹配，因此 git 包只有在字段增大时才会显示变更日志。`collapseChangelog` 设置会把该部分压缩为每个包一行，例如 `Updated my-pi-package to v1.2.0.`。与 Pi 自身的变更日志不同，`/changelog` 不显示包的变更日志，因此详情请阅读包的变更日志文件或仓库。

## 声明依赖

把扩展导入的运行时包放在 `dependencies` 中。Pi 在安装 npm 或 git 来源时会安装包依赖。

Pi 向扩展和技能提供这些包：

- `@earendil-works/pi-ai`
- `@earendil-works/pi-agent-core`
- `@earendil-works/pi-coding-agent`
- `@earendil-works/pi-tui`
- `typebox`

把上面列出的宿主提供的包以 `"*"` 范围声明在 `peerDependencies` 中，不要打包它们。对于受管理的 npm 包以及用 npm、pnpm 或 Bun 安装的 git 包，Pi 会抑制自动的 peer 安装。本地包不会被安装或修改，因此其依赖树仍由包作者负责。

不要在 `dependencies` 中列出宿主提供的包。一份实际副本可能绕过 Pi 在编译后的 ESM 中的扩展模块映射，造成重复的类、注册表和初始化工作。Pi 检测到这种清单配置时会报告扩展警告。作为依赖使用的其他 Pi 包必须包含在发布的 tarball 中，并通过其 `node_modules` 资源路径引用。

已安装的包以独立的模块根加载。不要依赖两个包共享同一个依赖实例，也不要依赖一个包解析另一个包未声明的依赖。

## 选择包资源

设置中的对象形式可缩小从包加载哪些资源：

```json
{
  "packages": [
    {
      "source": "npm:@example/pi-tools",
      "extensions": ["extensions/*.ts", "!extensions/legacy.ts"],
      "skills": [],
      "prompts": ["prompts/review.md"]
    }
  ]
}
```

对于每种资源类型：

- 省略该属性即加载包所允许的全部内容。
- 使用 `[]` 表示不加载该类型的任何内容。
- 使用 `!pattern` 排除 glob 匹配项。
- 使用 `+path` 包含一个精确的允许路径。
- 使用 `-path` 排除一个精确路径。

过滤器会缩小包的清单范围。它们不会暴露包本身未声明的资源。

运行 `pi config` 可启用或禁用已发现的资源和 pi 的内置扩展。它从个人配置开始；按 Tab 切换范围，或运行 `pi config --local` 从项目覆盖开始。

## 理解范围与身份

同一个包可以出现在个人设置和项目设置中。项目条目通常会替换个人条目。使用 `autoload: false` 时，项目条目则作为对个人包的过滤增量。

Pi 按包名识别 npm 包，按不含 ref 的仓库 URL 识别 git 包，按解析后的绝对路径识别本地包。这样可以防止同一个包通过等价的声明加载两次。

在打包之前，使用[扩展](../../../packages/coding-agent/docs/extensions.md)、[技能](skills.md)、[提示模板](prompt-templates.md)和[主题](themes.md)来设计每种资源。
