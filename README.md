# iTodo

> 一个使用codex vibe coding的基于 **React + Next.js + Cloudflare Workers + D1** 构建的个人任务管理与计划系统，帮助用户以「今日、周、本月」等多种视角管理待办事项，并支持任务分类、层级管理和周期复盘，打造轻量、高效的个人效率工具。

---

## ✨ 项目简介

iTodo 是一个现代化的 Todo 管理应用，不仅能够记录日常待办事项，还提供了更加完整的个人规划能力。项目采用前后端一体化架构，结合 Cloudflare Workers、D1 数据库以及 Drizzle ORM，实现轻量部署和云端数据管理。

相比传统 Todo 应用，iTodo 更关注用户的长期规划，通过「今日」、「本周」、「本月」、「复盘」等多个视图帮助用户建立持续、高效的任务管理体系。

---

## 🚀 项目特点

- 📅 多时间维度任务管理（今日、周、本月）
- 📂 支持任务分类与层级结构
- 🎨 深浅色主题切换
- ☁️ Cloudflare Workers 云端部署
- 🗄️ D1 数据库存储
- ⚡ Drizzle ORM 数据管理
- 🎯 响应式界面设计
- 📱 支持多端访问
- 🔧 模块化架构，便于扩展

---

## 🛠 技术栈

### 前端

- React
- Next.js
- TypeScript
- Tailwind CSS
- Shadcn UI
- Lucide Icons

### 后端

- Cloudflare Workers
- Vinxi
- Hono（路由）
- Drizzle ORM

### 数据库

- Cloudflare D1（SQLite）

---

## 📂 项目结构

```text
itodo
├── app/                  # 应用页面与业务代码
├── build/                # 构建输出
├── db/                   # 数据库 Schema
├── docs/                 # 项目文档
├── drizzle/              # Drizzle 迁移文件
├── examples/             # 示例代码
├── public/               # 静态资源
├── tests/                # 测试代码
├── worker/               # Cloudflare Worker
├── package.json
├── next.config.ts
├── vite.config.ts
├── drizzle
```

项目采用模块化设计，将页面、组件、数据库和工具函数分离，方便后续维护与功能扩展。

---

## 🎯 核心功能

### 1. 今日任务

用户可以查看当天所有待完成事项，并进行新增、编辑、删除和完成操作。

适用于每日任务管理，提高工作效率。

---

### 2. 周计划

按周展示所有任务，帮助用户制定短期目标。

用户可以：

- 查看本周待办
- 调整任务日期
- 规划一周工作

---

### 3. 月计划

提供整月任务视图，方便进行长期安排。

适用于：

- 学习计划
- 项目管理
- 工作排期

---

### 4. 层级任务

一个任务可以继续拆分多个子任务。

例如：

```text
完成毕业设计
├── 查阅文献
├── 数据处理
├── 模型训练
└── 撰写论文
```

这种树形结构能够帮助用户逐步拆解复杂目标。

---

### 5. 分类管理

支持按照不同类别管理任务，例如：

- 工作
- 学习
- 生活
- 娱乐

后续可以扩展颜色、图标等属性，提高任务辨识度。

---

### 6. 周复盘

项目提供 Review（复盘）数据模型，为后续实现：

- 本周总结
- 完成率统计
- 问题分析
- 下周计划

预留了数据支持。

---

### 7. 主题切换

支持主题配置，可扩展：

- Light
- Dark
- 自定义主题

提升用户使用体验。

---

## ⚙️ 功能实现原理

### 任务管理

任务以统一的数据模型进行管理，每条任务包含：

- 标题
- 描述
- 开始时间
- 截止时间
- 完成状态
- 分类
- 父任务

通过 parentId 建立树形关系，实现子任务功能。

---

### 页面切换

首页根据不同时间维度筛选任务。

例如：

- Today：过滤今天任务
- Week：过滤本周任务
- Month：过滤本月任务

无需维护多份数据，只根据日期动态计算。

---

### 数据存储

项目采用 Cloudflare D1 数据库。

数据流程：

```
页面
    ↓
React State
    ↓
API
    ↓
Cloudflare Worker
    ↓
Drizzle ORM
    ↓
D1 Database
```

Drizzle ORM 将数据库操作封装为 TypeScript 对象，提高开发效率，同时保证类型安全。

---

### 数据模型

目前项目主要包含以下核心实体：

#### Task

负责存储所有待办信息：

- id
- title
- description
- completed
- startDate
- endDate
- parentId

用于构建整个 Todo 树。

#### Review

用于保存用户的周期复盘信息，例如：

- 本周总结
- 收获
- 问题
- 下周计划

便于后续统计分析。

---

## 📈 系统架构

```text
                React UI
                    │
          页面 / Components
                    │
             React State
                    │
                API 请求
                    │
        Cloudflare Workers
                    │
             Drizzle ORM
                    │
          Cloudflare D1 数据库
```

整体采用前后端一体化设计，前端负责页面交互，Worker 提供接口服务，数据库负责持久化存储。

---

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 本地运行

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

### 部署

部署至 Cloudflare：

```bash
npm run deploy
```

---

## 📌 项目亮点

- 使用最新 React 技术栈开发
- 支持 Cloudflare 全栈部署
- ORM 与数据库完全类型安全
- 页面结构清晰，易于维护
- 模块解耦程度高，方便功能扩展
- 已预留 Review、分类等扩展能力，可进一步实现统计分析、提醒通知、团队协作等高级功能。

---

## 🔮 后续规划

- 用户登录与权限管理
- 云端数据同步
- 标签系统
- 重复任务
- 提醒通知
- 数据统计分析
- 番茄钟
- Markdown 编辑
- AI 智能任务拆分
- AI 周报/复盘生成
- 多设备实时同步

---

## 📄 License

MIT License

---

## 总结

iTodo 是一个基于现代 Web 技术栈开发的个人任务管理系统，通过「今日、周、本月、复盘」等多维度视图帮助用户高效管理任务。项目采用 React、Next.js、Cloudflare Workers 和 D1 数据库构建，整体架构清晰、模块划分合理，具有良好的可维护性和扩展性。未来可进一步结合 AI、数据分析和协同能力，打造更加智能的个人效率管理平台。
