# AE5i Pro 独立面板

面向 iPhone Safari 的独立车辆面板，首页加入可旋转和缩放的 3D 展示。

## 使用

使用 Safari 打开本仓库的 GitHub Pages 地址；网页无需 ChatGPT 登录。
原面板的极核账号登录界面保留。未登录时显示的模拟车辆与数据有明确提示，请在自己的浏览器中完成真实登录与车况核对。

单指拖动旋转、双指缩放，支持复位视角、自动旋转、原车图切换及失败重试。添加桌面：Safari 分享 → 添加到主屏幕。

## 模型与来源

- 展示模型借用 AE4 MAX2+，与 AE5i Pro 的真实外形不同。
- 面板公开产物与原始模型来自 https://github.com/lswlc33/zeeho-3d-models 。冻结来源见 source-info.json。
- 本仓库仅包含网页展示副本；保留车辆几何与贴图，仅隐藏原 App 专用充电线和阴影平面。
- 查看组件为 Google model-viewer，其许可证位于 vendor/model-viewer-license.txt。
- 本项目为独立适配版本，不是极核官方 App，也不会替换 iPhone 官方 App 的模型。

## 部署

仓库设置 → Pages → Deploy from a branch → main → / (root)。根目录保留 .nojekyll。
不需要新增 Actions 工作流或填写任何账号密钥。

## 验证边界

本地 Chromium/WebKit 基础交互测试通过。真实账号、验证码、实时车况、车控和 iPhone 主屏幕离线效果仍需使用者自行核对；开发验证不发送短信或执行车控。

本仓库不包含用户的浏览器存档、账号资料、VIN、截图、诊断日志或私人托管凭据。不要向仓库或聊天提交密码、token 和验证码。
