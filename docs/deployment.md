# 本地运行与部署

返回 [iTodo README](../README.md)。

## 环境要求

- Node.js `>= 22.13.0`
- npm
- 部署到 Cloudflare 时，需要已登录且有发布权限的 Cloudflare 账号

## 本地开发

在项目根目录执行：

```bash
npm install
npm run dev
```

开发服务器启动后，终端会输出访问地址，默认通常为 [http://localhost:3000](http://localhost:3000)。

## 构建与验证

```bash
npm run build
npm test
```

`npm run build` 会生成 Cloudflare Workers 所需的部署产物；`npm test` 会先构建，再运行渲染测试。

如需使用构建结果在本机以生产模式运行：

```bash
npm run start
```

## Cloudflare Workers 部署

项目使用 Vinext 构建，并在构建后写出 Workers 配置文件 `dist/server/wrangler.json`。完成构建后可执行：

```bash
npm run build
npx wrangler deploy --config dist/server/wrangler.json
```

首次部署前，请先通过 `npx wrangler login` 登录 Cloudflare。部署成功后，Wrangler 会在终端输出可访问的 Workers 地址。

### 修改部署名称或绑定

- 默认 Workers 名称来自项目包名 `itodo-local-planner`。
- 如需更改名称、绑定 D1、R2 或其他 Cloudflare 资源，请调整项目根目录的 `.openai/hosting.json`，再重新执行构建。
- `vite.config.ts` 会将声明的资源绑定用于本地开发模拟；实际生产资源需要在 Cloudflare 控制台或 Wrangler 中创建并配置。

## 数据与部署注意事项

iTodo 当前将业务数据保存在用户浏览器的 LocalStorage 中，因此部署本身不需要数据库、环境变量或数据迁移。它也意味着：

- 每个浏览器和用户名拥有独立的本地数据。
- 清除站点数据、切换设备或无痕模式都会导致数据不可见或丢失。
- 若要支持跨设备同步、真实登录或多人协作，需要将计划数据迁移到后端数据库，并接入身份认证。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动本地开发服务 |
| `npm run build` | 生成生产构建与 Workers 部署产物 |
| `npm run start` | 使用生产模式本地运行 |
| `npm test` | 构建并执行测试 |
| `npm run lint` | 运行 ESLint 检查 |

