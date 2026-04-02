FROM node:{{nodeVersion}}-alpine

WORKDIR /app

# 启用 corepack，保证 pnpm 版本可用
RUN corepack enable

# 优先复制依赖清单，利用构建缓存
COPY package.json ./
COPY pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制项目文件并构建
COPY . .
RUN pnpm run build

EXPOSE {{devPort}}

# 默认启动开发服务，可按需在生成后调整
CMD ["pnpm", "run", "dev"]
