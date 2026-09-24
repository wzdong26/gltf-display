

# <img src="https://wzdong26.github.io/gltf-display/favicon.ico" width="32px"> glTF Display

<center style="font-size: 20px">
    <a href="https://github.com/wzdong26/gltf-display/">
        <img height="18px" src="https://github.githubassets.com/pinned-octocat.svg" alt="💻"/> Github
    </a>
    |
    <a href="https://www.npmjs.com/package/gltf-display">📦 NPM</a>
    | 
    <a href="https://github.com/wzdong26/gltf-display/issues">👨‍🔧 Issues</a>
</center>
<!-- <p align="right">
    <a href="https://github.com/wzdong26/gltf-display/tree/main/README_zh.md">中文</a>
    - | -
    <i>EN</i> 
</p> -->

## 📑 Homepage

**[https://wzdong26.github.io/gltf-display/editor/](https://wzdong26.github.io/gltf-display/editor/)**

## 📙 Introduction

这是一个 glTF 3D 模型预览编辑器，项目基于 ThreeJS 实现。支持功能包括：

- 支持拖拽上传本地 3D 模型（.glb/.gltf）文件预览效果（可支持文件夹上传）；
- 支持在线 glTF 文件 URL 路径输入预览效果；
- 支持场景及模型参数调节，包括：背景色/透明度、可交互、场景旋转、灯光、模型线框（wireframe）、模型动画（animations）、等；
- 支持截图（screenCapture），制作立体图像；
- 支持分享（share），作为纯 web 页面分享到任何地方，包括作为 iframe 嵌入到你的 web 应用中（只支持在线 glTF 模型分享，本地 glTF 模型暂不支持）；
- 持续更新中。。。

> 点击 [Homepage](https://wzdong26.github.io/gltf-display/editor/) 即可在线体验

## 🛠 Installation

除了上面介绍的 Web 应用之外，该项目的核心包还支持 npm 引入：

```cmd
npm install gltf-display three

## yarn
yarn add gltf-display three

## pnpm
pnpm add gltf-display three
```

或者也可以直接通过 CDN 引入:

```html
<script type="importmap">
  {
    "imports": {
      "gltf-display": "https://cdn.jsdelivr.net/npm/gltf-display@x.x.x",
      "three": "https://cdn.jsdelivr.net/npm/three@x.x.x/build/three.module.js",
      "three/examples/": "https://cdn.jsdelivr.net/npm/three@x.x.x/examples/"
    }
  }
</script>

<script type="module">
  import { Configurator, Viewer } from "gltf-display";
  // ...
</script>
```

## Getting Started

[gltf-display](https://www.npmjs.com/package/gltf-display) 的使用非常简单，你只需要像下面这样就可以创建一个 3D 场景：

```javascript
import { Configurator } from "gltf-display";
const { conf } = new Configurator();
conf.src = "https://wzdong26.github.io/gltf-display/loading/scene.gltf";
conf.rotate = 30;
```

### 代码示例：

- [一个 3D loading](https://code.juejin.cn/pen/7355343218529009714)
- [加载动画及动画切换](https://code.juejin.cn/pen/7355029076492910642)

## API

gltf-display 采用 jsDoc 类型注解，保证在开发过程中舒适的代码提示。

- Configurator

`Configurator` 是实现 gltf 模型预览的一个声明式 API。你只需要声明 `Configurator.conf` 对象上的属性就可以创建一个 3D 场景。

```typescript
type ConstructorParameters<Configurator> = [
  {
    container?: Element; // canvas 的父容器
  }
];
```

- Configurator.conf

```typescript
Configurator.conf: {
    bgColor: string; // 背景色
    bgOpacity: number; // 背景透明度
    enableCtrl: boolean; // 场景是否可交互控制
    rotate: number; // 场景旋转速度，负数为顺时针旋转，正数为逆时针旋转
    lightColor: string; // 环境光照颜色
    lightIntensity: number; // 环境光照强度
    src: string; // 在线 gltf 模型 url
    wireframe: boolean; // gltf 模型是否以线框结构显示
    boxHelper: boolean; // 是否显示 gltf 模型外包围盒
    zoom: number; // 控制 gltf 模型距离相机远近，值越大相机距离越远，模型视觉效果越小
    alpha: number; // 控制相机高度，值越大越高，显示俯瞰角度
    animationSpeed: number; // 动画速度，仅在加载动画时有效
    animations: string[]; // 指定加载 gltf 模型的哪些动画，仅在 gltf 模型中有该动画时有效
}
```

- Viewer

`Viewer` 是实现 gltf 模型预览的一个命令式 API。它更加基础。

```typescript
type ConstructorParameters<Viewer> = [
  {
    camera: { fov: number; near: number; far: number }; // threejs 中 PerspectiveCamera 初始化参数
    renderer: WebGLRendererParameters; // threejs 中 WebGLRenderer 初始化参数
  }
];
```

- Viewer

`Viewer` 是实现 gltf 模型预览的一个命令式 API。它更加基础。

```typescript
type ConstructorParameters<Viewer> = [
  {
    camera: { fov: number; near: number; far: number }; // threejs 中 PerspectiveCamera 初始化参数
    renderer: WebGLRendererParameters; // threejs 中 WebGLRenderer 初始化参数
  }
];
```

- Viewer.loadGLTF

```typescript
typeof loadGLTF = (url:string, blobs?:Record<string, Blob>) => Promise<GLTF>
```

## 🙆‍♂️ Contributor

- Author: **wzdong**
- Email: wzdong.26@qq.com
- Github: https://github.com/wzdong26
