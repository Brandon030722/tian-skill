# 源码证据与复核方式

下列文件是 2026-11-19 实际 HTTP 获取的公开部署产物。普通网页抓取可能只看到挂载壳。构建文件的本地函数名或短片段用于定位，分包更新时可能变化。页面结构由运行时 DOM 和截图补充。

## 库洛游戏公司官网

[首页 HTML](https://www.kurogames.com/) 提供 `#root`、模块与旧版入口，脚本解析语言与路由并选择桌面或移动布局。首页由横幅、产品、特色和页脚组成，与公司介绍、招聘、联系共用导航外壳。[入口 JS](https://www.kurogames.com/static/js/entry-CsjLxb8A.js) · [桌面 CSS](https://www.kurogames.com/static/css/pc-CwU--dHr.css) · [移动 CSS](https://www.kurogames.com/static/css/m-CLZGLby2.css)

| 定位标记 | 构建文件与浏览器验证 | Tian 的转译 |
| --- | --- | --- |
| `animateProductSwitch`、`Product` | 入口 JS 约 26684–27025 行。React 状态切换当前产品，GSAP 在约 0.5 秒内交换两面的 flex 分配，代码里的目标比例为 84.4% 和 15.6%。CTA `.home-btn` 有独立的延迟位移和淡入。 | 样例选中的航线横向扩张，媒体本身留在各自面板里。描述和按钮反馈独立处理。过渡时状态仍然可读可选，无需保留参考站的比例或轨迹。 |
| `.cont.active .mask-cont`、`.home-btn:hover:after` | 桌面 CSS 用遮罩压暗非当前媒体，悬停降低遮罩，选中解除遮罩。长条操作另外用伪元素渐入。 | `.route-tab::after` 调整图层明度，`.action-frame::after` 提供独立覆层。键盘焦点保留自己的外环。 |
| `PCView$2`、`MobileView$2`、`.home-swiper` | 桌面场景时间线以高度揭幕、海报缩放与标题位移编排，滚动期间有重复触发保护。手机加载独立样式和纵向 Swiper。两种布局都已在浏览器挂载验证。 | 大媒体、产品和资讯分别组织，移动端保留内容顺序并重新布局。样例使用原生滚动，交互性媒体组局部管理状态。 |

相关页面补充了三种版式。公司介绍的时间轴在桌面提供切换和拖拽，移动切换图文。招聘以独立标签切换章节。联系页桌面为折行多列，移动为标签、内容和分隔线。[公司介绍](https://www.kurogames.com/introduction) · [加入我们](https://www.kurogames.com/join) · [联系页](https://www.kurogames.com/contact)

## 《鸣潮》官网

[首页 HTML](https://mc.kurogames.com/main#main) 提供 `#app`、语言与 SEO 数据、浏览器设备跳转逻辑。Vite、Vue 3、Vue Router 与 Pinia 可在公开入口中识别。桌面、手机、资讯列表和详情按路由分包。[入口 JS](https://mc.kurogames.com/static4.0/assets/index-d952cc92.js) · [桌面页面 JS](https://mc.kurogames.com/static4.0/assets/index-8854339b.js) · [移动页面 JS](https://mc.kurogames.com/static4.0/assets/index-1a27e0be.js)

| 定位标记 | 构建文件与浏览器验证 | Tian 的转译 |
| --- | --- | --- |
| `Z.activeIndex`、`Z.running`、`location.hash`、`is-current-slide` | 桌面分包通过索引协调导航、锚点和当前与相邻章节的首次挂载，已挂载章节保留。滚轮处理器换章并有约 600ms 的节流，另有进行中的状态保护。CSS 通过当前章节和导航类名控制可见或亮起。 | 章节用可直接访问的 ID，链接操作写 hash，滚动观察只更新 `aria-current`。样例用原生页面位移，导航来回和深链依旧可用。 |
| `page-swiper`、`data-hash`、`hash-navigation` | 移动分包配置纵向 Swiper，以每章的 `data-hash` 对应位置，配置地址变化同步。手机运行图确认独立菜单、竖裁画面和纵向平台操作。 | 使用不同媒体裁切和导航形态，保持共享的章节 ID。横向媒体板折叠为标签与单张全宽场景。 |
| `video-bg`、`eject-video-wrapper`、`poster:w.value.coverImage` | 桌面满屏媒体与前景交互分层，圆形播放入口打开带控件的视频。移动背景媒体配置封面、静音、行内播放，并捕获播放失败。 | 大图先绘制，圆形入口按需开播放器，Esc 关闭、暂停并还原焦点。无法启动时保留封面和状态反馈。 |

运行观察还覆盖资讯、阵容章节与英文入口。桌面资讯样式包含 `.artical-left` 和 `.artical-right` 两列，配日期、分类、分隔线和成对分页。手机改为单列。阵容将可操作的条目与大图和标题分开。样例把资讯信息层级转为可筛选且可展开的日志。[桌面首页样式](https://mc.kurogames.com/static4.0/assets/index-04354920.css) · [移动首页样式](https://mc.kurogames.com/static4.0/assets/index-7016c18a.css) · [资讯](https://mc.kurogames.com/main/news) · [资讯 CSS](https://mc.kurogames.com/static4.0/assets/list-477d22d5.css) · [手机资讯](https://mc.kurogames.com/m/main/news) · [英文入口](https://wutheringwaves.kurogames.com/en/main)

## OJO

采用 GitHub 上 touchine-ojo 的 OJO Design Skills 仓库。固定提交 `3ef911afdc605395a9d74b39eacd0298b70960f9` 的组件规范提供实色主按钮、描边次按钮、可见焦点、八态以及按压缩放示例。Tian 采用独立的 HTML、CSS 和 JS；加载中的重复执行由事件状态阻止。样例的美术是为原创题材生成的。OJO 许可可从固定提交查阅。[按钮范例](https://github.com/touchine-ojo/OJO-Design-Skills/blob/3ef911afdc605395a9d74b39eacd0298b70960f9/skills/app-ui-ux-best-practices/references/component-recipe.md#L246-L295) · [动效参考](https://github.com/touchine-ojo/OJO-Design-Skills/blob/3ef911afdc605395a9d74b39eacd0298b70960f9/skills/app-ui-ux-best-practices/references/motion-system.md) · [MIT 许可](https://github.com/touchine-ojo/OJO-Design-Skills/blob/3ef911afdc605395a9d74b39eacd0298b70960f9/LICENSE)
