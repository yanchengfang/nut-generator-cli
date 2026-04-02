version: "3.9"

services:
  # 前端服务：用于本地开发与热更新
  frontend:
    image: {{projectName}}-frontend:latest
    build:
      context: .
      dockerfile: ./Dockerfile.node
      args:
        NODE_VERSION: "{{nodeVersion}}"
    container_name: {{projectName}}-frontend
    working_dir: /app
    command: ["{{packageManager}}", "run", "dev", "--", "--host", "0.0.0.0", "--port", "{{devPort}}"]
    ports:
      - "{{devPort}}:{{devPort}}"
    volumes:
      - ./:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
      APP_PORT: "{{devPort}}"

  # Nginx 服务：用于模拟生产静态资源托管与反向代理
  nginx:
    image: {{projectName}}-nginx:latest
    build:
      context: .
      dockerfile: ./Dockerfile.nginx
    container_name: {{projectName}}-nginx
    depends_on:
      - frontend
    ports:
      - "{{nginxPort}}:{{nginxPort}}"
    environment:
      NGINX_PORT: "{{nginxPort}}"
