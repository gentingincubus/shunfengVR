# Repository Guidelines (shunfengVR 全景漫游端)

## 1. 项目定位与架构
本仓库是顺峰山公园 720° 空间全景漫游系统的核心前台展示端，基于 **Vue 3**、**Vite**、**Three.js** 与 **@tweenjs/tween.js** 构建。
主代码位于 `src/`：
- `views/VrPlayerView.vue`：PC 桌面端全景漫游核心视图；
- `views/mobile/VrPlayerViewMobile.vue`：移动端/微信 H5 全景漫游专属优化视图；
- `utils/nadirPatch.js`：脚底高精度补地遮罩（Nadir Patch）Canvas 纹理生成器与 3D 网格构建工厂；
- `api/vr.js`：只读全景园区与场景点位接口；
- `docs/`：渲染架构设计、渐进式贴图管线与变更记录。

---

## 2. 构建与本地运行命令
- `npm run dev`：启动本地开发服务器（默认端口：5174）；
- `npm run build`：执行生产环境静态包打包（输出至 `dist/`，可直接通过 Nginx 托管）。

---

## 3. 3D 全景渲染核心铁律与性能约束 ⚡

### 3.1 纯原生 Three.js 变量隔离
- **绝对严禁将 Three.js 核心对象（`scene`, `camera`, `renderer`, `controls`, `currentSphere`, `nadirMesh`, `textures`）放入 Vue 的 `ref()` 或 `reactive()` 中！**
- Vue 3 的深度响应式 Proxy 会严重破坏 Three.js 内部的每帧变换矩阵缓存与原型链，造成严重的性能卡顿和显存抖动；必须以普通原生 `let` 变量形式在 `<script setup>` 顶层持有。

### 3.2 显存泄漏严格防御（GPU Memory Dispose）
- 场景切换、组件卸载时，旧全景球必须严格执行显存释放：
  ```javascript
  scene.remove(oldMesh);
  oldMesh.geometry.dispose();
  if (oldMesh.material.map) oldMesh.material.map.dispose();
  oldMesh.material.dispose();
  ```
- 绝对禁止无限制在 Scene 中堆积 Mesh 导致移动端浏览器崩溃（OOM）。

### 3.3 双阶段渐进式秒开渲染（LQIP）
- 场景进入与切换必须优先加载 `lowResUrl`（约 30KB 底图），在 0.05~0.1 秒内解除 loading 遮罩并响应用户交互；
- 高清大图（`panoramaUrl`）必须在后台静默异步下载，下载完成后原地热替换网格材质 `material.map` 并销毁旧低清贴图。

### 3.4 脚底补地遮罩（Nadir Patch）渲染规范
- 补地遮罩圆盘必须配置 `depthTest: false`、`depthWrite: false` 以及 `renderOrder = 999`，防止被外层球壳深度测试裁切。

---

## 4. 文档体系维护（`docs/`）规范 📖
涉及 3D 渲染管线、交互动效、着色器或贴图流控改造时，智能体**必须在 `docs/` 目录下同步更新或追加文档**：
- **文首版本总表铁律**：所有架构与核心渲染文档最上方，**必须放置版本变更总表**（列包含：`| 版本 | 日期 | 变更内容 (精炼概述优化/修复了什么渲染特性) | 关联分支 |`），方便人类开发者秒级获知版本演进，下方展开详细 3D 渲染管线设计；
- `docs/architecture/`：核心图形学渲染与管线架构设计文档；
- `docs/changelog/`：版本与体验优化变更记录。

---

## 5. 分支开发与提交流程
- 所有任务必须基于 `feature/*` 或 `hotfix/*` 分支；
- 提交前必须执行 `npm run build` 确保打包无误；
- **【严禁自动本地提交与推送（禁止自动执行 git commit & git push）⚠️】**：
  - **核心诉求**：人类开发者需要在 IDE Git 面板中直观对比查看每次修改的代码行级 Diff，便于复核、学习与把控每行代码细节；
  - **绝对禁止自动 commit**：智能体在完成 3D 渲染调试与构建打包验证后，**严禁自动执行 `git commit`，更严禁执行 `git push`！**
  - **保留工作区差异状态**：所有代码变动必须完整保留在本地工作区（Working Tree 未提交状态），供人类开发者亲自 Review 每一行代码差异；
  - **提交控制权归还**：只有当人类开发者在对话中明确要求“提交一版代码”、“帮我 commit”、“帮我 push”等显式指令时，方可按指令执行操作。

