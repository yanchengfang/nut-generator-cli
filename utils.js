import fs from "fs-extra";
import ora from "ora";
import chalk from "chalk";
import path from "path";
import shell from "shelljs";
import logSymbols from "log-symbols";

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

// 删除文件夹
export async function removeDir(dir) {
  const spinner = ora({
    text: `正在删除文件夹${chalk.cyan(dir)}`,
    color: "yellow"
  }).start();

  try {
    await fs.remove(resolveApp(dir));
    spinner.succeed(chalk.green(`删除文件夹 ${chalk.yellow(dir)} 成功`));
  } catch(err) {
    spinner.fail(chalk.red(`删除文件夹 ${chalk.yellow(dir)} 失败`));
    console.log(err);
    return;
  }
}

export async function changePackageJson(name, info, isIgnore) {
  try {
    const pkg = await fs.readJson(resolveApp(`${name}/package.json`));
    pkg.name = name;
    if (isIgnore) {
      Object.keys(info).forEach((item) => {
        if (item === "keywords") {
          if (info[item] && info[item].trim()) {
            pkg[item] = info[item].split(",");
          } else {
            pkg[item] = [];
          }
        } else {
          pkg[item] = info[item];
        }
      });
    }
    await fs.writeJson(resolveApp(`${name}/package.json`), pkg, { spaces: 2 });
  } catch (err) {
    console.log(logSymbols.warning, chalk.yellow(`自定义修改信息失败！可以去 ${name}/package.json 手动修改`));
    console.log(err);
  }
}

export function npmInstall(dir) {
  const spinner = ora("正在安装依赖......").start();
  if (shell.exec(`cd ${shell.pwd()}/${dir} && npm install --force -d`).code !== 0) {
    console.log(
      logSymbols.warning, 
      chalk.yellow(`自定义修改信息失败！可以去 ${name}/package.json 手动修改`)
    );
  }
  spinner.succeed(chalk.green("~~~依赖安装成功~~~"));
}