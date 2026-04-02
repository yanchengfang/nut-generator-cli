name: CI-Flow

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 安装 Node
        uses: actions/setup-node@v4
        with:
          node-version: "{{nodeVersion}}"
          cache: "{{packageManager}}"

      - name: 安装依赖
        run: {{packageManager}} install

      - name: 代码检查
        run: {{packageManager}} run lint

      - name: 运行测试
        run: {{packageManager}} run test --if-present

      - name: 生产构建
        run: {{packageManager}} run build
