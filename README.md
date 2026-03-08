# NameKura

NameKura 是一个极简中文起名社区前端，使用 React、TypeScript、Tailwind CSS v4 和 Supabase 构建。

当前界面采用全屏可拖动画布与蜂巢式六边形排布。用户可以浏览名字、点击复制、匿名上传，以及匿名点赞 / 点踩。

## 功能特性

- 全屏蜂巢式名字画布
- 画布支持向四周拖动
- 点击名字直接复制到剪贴板
- 复制时带有涟漪反馈
- 极简悬浮上传输入框
- 匿名上传名字
- 匿名点赞 / 点踩
- 姓氏蓝色高亮，名字其余部分为黑色
- 支持常见复姓，例如 `欧阳`

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Supabase

## 目录结构

```txt
src/
  components/    界面组件
  lib/           数据访问、名字解析、session、布局工具
  types/         类型定义
supabase/
  schema.sql     数据库结构、RLS、函数、触发器
docs/
  supabase-backend.md
```

## 本地开发

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example`，新建 `.env.local`：

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

不要把 Supabase 的 `service_role` key 放到前端。

### 3. 应用 Supabase Schema

打开 Supabase 控制台的 SQL Editor，执行：

- [`supabase/schema.sql`](./supabase/schema.sql)

如果你的数据库已经跑过旧版本 schema，还需要补执行后续的增量 SQL 变更。

### 4. 插入测试数据

示例：

```sql
insert into public.names (surname, given_name, source, status, tags)
values
  ('林', '知遥', 'seed', 'published', array['清雅']),
  ('周', '时序', 'seed', 'published', array['诗意']),
  ('欧阳', '知遥', 'seed', 'published', array['清雅']);
```

### 5. 启动开发环境

```bash
pnpm dev
```

### 6. 构建生产版本

```bash
pnpm build
```

## Supabase 说明

当前后端方案是匿名优先：

- 匿名用户可以读取名字
- 匿名用户可以上传名字
- 匿名用户可以点赞 / 点踩
- 匿名用户可以记录复制事件

匿名身份通过浏览器中的 `session_id` 持久化，保存在 `localStorage`。

更多后端设计说明见：

- [`docs/supabase-backend.md`](./docs/supabase-backend.md)
- [`supabase/schema.sql`](./supabase/schema.sql)

## 关键文件

- 应用入口：[`src/App.tsx`](./src/App.tsx)
- Supabase 客户端：[`src/lib/supabase.ts`](./src/lib/supabase.ts)
- 名字接口：[`src/lib/api/names.ts`](./src/lib/api/names.ts)
- 名字解析：[`src/lib/name-parser.ts`](./src/lib/name-parser.ts)

## 许可证

MIT，见 [`LICENSE`](./LICENSE)。
