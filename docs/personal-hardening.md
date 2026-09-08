# 个人部署安全配置

这份配置用于单用户、自有 Android 设备和自有 Render 服务。它不改变原项目署名、许可证或 Android 功能实现，只收窄 MCP 的公网入口与默认工具范围。

## 默认边界

- 主动关心策略默认关闭，不预设占有、管束、反话或“嘴硬”判断。
- 普通 MCP 只注册 `LINJIAN_TOOL_ALLOWLIST` 中的工具。
- 所有下发到手机的动作还要通过 `LINJIAN_COMMAND_ALLOWLIST`，避免通用命令绕过工具白名单。
- 小金库/外卖 MCP 与旧 SSE 默认关闭。
- Streamable HTTP MCP 使用独立的私密路径凭证。

## Render 环境变量

`render.yaml` 会为 MCP 服务自动生成 `LINJIAN_MCP_PATH_TOKEN`。部署后，在 Render 的 MCP 服务环境变量页面查看它，并把客户端地址写成：

```text
https://你的-mcp-域名/mcp/你的-LINJIAN_MCP_PATH_TOKEN
```

手机仍然连接 server 服务：

```text
服务器地址：https://你的-server-域名
Token：LINJIAN_TOKEN
设备 ID：android-phone
```

`LINJIAN_TOKEN` 与 `LINJIAN_MCP_PATH_TOKEN` 用途不同，不要互换，也不要把真实值提交到 GitHub。

## 为什么使用私密路径

ChatGPT 插件的正式用户认证方案是 OAuth 2.1，不能让 ChatGPT 携带用户自定义 API Key。个人试运行先使用可轮换的高熵私密路径，让公开的 `/mcp` 不再直接暴露工具。它比完整 OAuth 简单，但路径可能出现在客户端配置和服务日志里，因此：

- 不要截图或公开完整 MCP URL；
- 怀疑泄露时，在 Render 里轮换 `LINJIAN_MCP_PATH_TOKEN`；
- 需要多人使用或正式发布时，改为完整 OAuth 2.1，不继续依赖私密路径。

## 修改能力范围

以后要增加能力，需要同时检查两层：

1. 把工具名加入 `LINJIAN_TOOL_ALLOWLIST`；
2. 如果该工具会给手机下发动作，把对应 action 加入 `LINJIAN_COMMAND_ALLOWLIST`。

只增加工具、不增加 action 时，工具会以 `PHONE_COMMAND_NOT_ALLOWED` 失败。这是故意的安全兜底。

## 首次安装

1. 先部署 server 与 MCP，确认两个 `/health` 正常。
2. 安装 APK，填写 server 地址、`LINJIAN_TOKEN` 和设备 ID。
3. 按双方商定范围逐项开启 Android 权限，不必一次全部开启。
4. 先连接 MCP 私密地址，调用 `linjian_status`。
5. 再分别测试读取状态、窗语、通知、闹钟、日历、打开 App 与按需截图。

