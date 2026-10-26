# AE5i Pro 独立面板

面向 iPhone Safari 的独立车辆面板，首页加入可旋转和缩放的 3D 展示。

## 使用

使用 Safari 打开本仓库的 GitHub Pages 地址；网页无需 ChatGPT 登录。
原面板的极核账号登录界面保留。未登录时显示的模拟车辆与数据有明确提示，请在自己的浏览器中完成真实登录与车况核对。

单指拖动旋转、双指缩放，支持复位视角、自动旋转、原车图切换及失败重试。添加桌面：Safari 分享 → 添加到主屏幕。

独立版 1.2.0 已同步作者面板 6.93（2f22997）。在首页「展示模型」中切换 AE4 MAX2+、咕咕嘎嘎企鹅装、DeepSeek 玩偶、巫女半身像、悟空手办、复古废土摩托。页面记住选择；扩展模型只在选中时下载，巫女约 37 MB、复古摩托约 59 MB。

「从相册选车图」仅在浏览器内处理并保存图片，不上传、不读取 VIN。刷新后可恢复；「恢复默认车图」只清除该入口的图片，不清理登录信息。Safari 禁止存储时明确提示仅本次显示。

## 模型与来源

- 展示模型借用 AE4 MAX2+，与 AE5i Pro 的真实外形不同。
- 面板公开产物与原始模型来自 https://github.com/lswlc33/zeeho-3d-models 。冻结来源见 source-info.json。
- 本仓库仅包含网页展示副本；保留车辆几何与贴图，仅隐藏原 App 专用充电线和阴影平面。
- 查看组件为 Google model-viewer，其许可证位于 vendor/model-viewer-license.txt。
- 企鹅装原作 Gugugaga：planktonfun / planktonminions，https://sketchfab.com/3d-models/gugugaga-fa1d5c98a98f40f080796e54929b9889 ，CC BY 4.0。
- DeepSeek 玩偶原作 Deepseek Fumo：xunbile，https://sketchfab.com/3d-models/deepseek-fumo-4da1c304ea11410b97f0f727dd51aca9 ，CC BY 4.0。
- 巫女半身像来自上游公开模型库，上游未单独注明作者或许可。三个角色使用上游适配版原文件，保留内嵌署名，未再修改模型几何或贴图；固定来源与文件校验值见 models/model-sources.json，页面使用说明包含可点击署名和许可链接。
- 复古废土摩托：haloworld3dassets，Motorcycle Post-Apocalyptic Style 2，CC BY 4.0；悟空手办：用户提供，源文件标注 CG 美术之家链接，未单独注明许可。具体原作链接、署名和转换说明见 guide.html 与 models/user-model-sources.json。
- 上游新 API 调试台与 Apache 2.0 主题许可随网站保留；安卓 APK 不属于此 iPhone 网页部署。
- 本项目为独立适配版本，不是极核官方 App，也不会替换 iPhone 官方 App 的模型。

## 部署

仓库设置 → Pages → Deploy from a branch → main → / (root)。根目录保留 .nojekyll。
不需要新增 Actions 工作流或填写任何账号密钥。

## 验证边界

本地 Chromium/WebKit 基础交互测试通过。真实账号、验证码、实时车况、车控和 iPhone 主屏幕离线效果仍需使用者自行核对；开发验证不发送短信或执行车控。

本仓库不包含用户的浏览器存档、账号资料、VIN、截图、诊断日志或私人托管凭据。不要向仓库或聊天提交密码、token 和验证码。
