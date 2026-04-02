import clone from "./gitClone.js";
import logSymbols from "log-symbols";
import shell from "shelljs";
import chalk from "chalk";
import figlet from "figlet";
import fs from "fs-extra";
import { templates, message } from "./constants.js";
import { inquirerConfirm, inquirerChoose, inquirerInputs } from './interactive.js';
import { removeDir, changePackageJson, npmInstall } from "./utils.js";

const initAction = async (name, option) => {
  // 检测用户是否安装了git
  if (!shell.which("git")) {
    console.log(logSymbols.error, chalk.red("必须安装git后才能运行脚本！"));
    shell.exit(1);
  }

  let repository = '';
  let selectedTemplateName = "";
  if (option.template) {
    const template = templates.find(item => item.name === option.template);
    if (!template) {
      console.log(logSymbols.error, chalk.red(`不存在模板${chalk.yellow(option.template)}`));
      console.log(`\r\n 可输入命令 ${chalk.cyan("nut list")} 查看模板列表`);
      return;
    }
    repository = template.value;
    selectedTemplateName = template.name;
  } else {
    // 选择模板
    const answer = await inquirerChoose("请选择一个项目模板", templates);
    repository = answer.choose;
    const selectedTemplate = templates.find(item => item.value === repository);
    selectedTemplateName = selectedTemplate ? selectedTemplate.name : "";
  }

  // 验证项目名称是否符合规范
  if (name.match(/[\u4E00-\u9FFF`~!@#$%&^*[\]()\\;:<.>/?]/g)) {
    console.log(logSymbols.error, chalk.red("项目名称存在非法字符！"));
    return; 
  }

  // 验证是否存在同名文件夹
  if(fs.existsSync(name) && !option.force) {
    console.log(logSymbols.warning, `检测已存在项目文件夹：${chalk.yellow(name)}`);
    const answer = await inquirerConfirm("是否进行删除?");
    if (answer.confirm) {
      await removeDir(name);
    } else {
      console.log(logSymbols.error, chalk.red("项目创建失败，存在同名文件夹！"));
      return;
    }
  } else if (fs.existsSync(name) && option.force) {
    await removeDir(name);
  }

  // 拉取模板
  try {
    await clone(repository, name);
  } catch (err) {
    console.log(logSymbols.error, chalk.red("项目创建失败！"));
    console.log("🚀 ~ initAction ~ err:", err);
    shell.exit(1);
  }

  // 写入项目信息
  let resMes;
  if (!option.ignore) {
    resMes = await inquirerInputs(message);
  }
  await changePackageJson(name, resMes, !option.ignore, selectedTemplateName);

  // 是否自动安装依赖
  const answer = await inquirerConfirm("是否自动安装依赖?");
  if (answer.confirm) {
    npmInstall(name);
  }
  
  // 底部展示信息
  console.log("\r\n" + chalk.cyan(figlet.textSync("welcome  to  NUT", {
    font: "Standard",
    horizontalLayout: "default",
    verticalLayout: "default",
    width: 80,
    whitespaceBreak: true
  })));

  console.log(`\r\n Run ${chalk.cyan("nut <command> --help")} for detailed usage of given command.`);
}

export default initAction;