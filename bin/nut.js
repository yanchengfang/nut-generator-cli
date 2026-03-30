#!/usr/bin/env node
import figlet from "figlet";
import chalk from "chalk";
import { templates } from "../constants.js";
import initAction from "../initAction.js";
import { program } from "commander";
import { readFile } from 'fs/promises';

// es-module 默认不支持读取json文件
// 方法一
// const pkg = JSON.parse(
//   await readFile(new URL("../package.json", import.meta.url))
// )

// 方法二
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require('../package.json');

// 方法三：使用插件fs-extra的api来读取json

program.version(pkg.version, "-v, --version");

program.name("nut")
  .description(chalk.cyan("坚果 一个简单的脚手架工具"))
  .usage("<command> [options]")
  .on("--help", () => {
    console.log("\r\n" + chalk.cyan(figlet.textSync("Nut Present", {
      font: "Standard",
      horizontalLayout: "default",
      verticalLayout: "default",
      width: 80,
      whitespaceBreak: true
    })));
  })

program.command("create <app-name>")
  .description("create a project")
  .option("-t --template [template]", "输入模板名称创建项目")
  .option("-f --force", "强制覆盖本地同名项目")
  .option("-i --ignore", "忽略项目相关描述，快速创建项目")
  .action(initAction);

program.command("list")
  .description("查看所有可用的模板")
  .action(() => {
    console.log(chalk.bgCyanBright("所有可用模板："));
    templates.forEach((item, index) => {
      console.log(`${index + 1}. ${chalk.cyan(item.name)} ${item.desc}`);
    })
  })

program.parse(process.argv);