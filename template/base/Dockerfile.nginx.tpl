FROM node:{{nodeVersion}}-alpine AS builder

WORKDIR /app

# 启用 corepack，保证 pnpm 版本可用
RUN corepack enable

# 优先复制依赖清单，利用构建缓存
COPY package.json ./
COPY pnpm-lock.yaml* ./

# 安装依赖并构建产物
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM nginx:alpine

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制前端构建产物
COPY --from=builder /app/{{outputDir}} /usr/share/nginx/html

EXPOSE {{nginxPort}}

CMD ["nginx", "-g", "daemon off;"]
