# 尼奥滑板奇遇

小熊尼奥竖版三维滑板体验：左右换道、跳跃吃金币，躲开障碍和咕咚博士扔下的香蕉皮。

使用真实角色模型、原滑板贴图和动画背景音乐。支持触摸大按钮、滑动及键盘方向键/空格；包含暂停、静音及碰撞保护。

## 本地运行

使用 Node.js 24+ 执行 `npm test`。用 `python3 -m http.server 8770 --bind 127.0.0.1` 启动后，访问 http://localhost:8770/ 。

## GitHub Pages

把此目录的内容放在仓库根目录。仓库默认分支应为 `main`。在仓库 Settings → Pages → Build and deployment 选择 GitHub Actions；主分支的后续提交会先测试，再发布 `_site` 内的游戏运行文件。

部署完成的项目地址以 GitHub Actions 中的 deployment 输出为准。此仓库的 GitHub Pages 站点可作为外发体验入口。

## 权利与第三方依赖

© Neobear。角色、模型、贴图、原声、配乐和品牌素材保留各自权利。公开体验与代码可见不构成开源授权或素材再利用许可。第三方 Three.js 使用 MIT 许可，详见 vendor/LICENSE。素材文件及校验值见 ASSETS.json。

## 原型范围

博士目前采用正式角色渲染图在三维场景中飞行。尼奥滑板姿态已完成 Blender 静态快照检查；网页实际 GPU 画面、音频听审及各移动设备触摸体验尚待验收。本项目尚未集成到原生 App。
