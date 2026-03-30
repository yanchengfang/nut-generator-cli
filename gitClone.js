import download from "download-git-repo";
import ora from "ora";
import chalk from "chalk";

export default function clone(remote, name, options) {
  const spinner = ora("正在拉取项目......").start();
  return new Promise((reslove, reject) => {
    download(remote, name, options, err => {
      if (err) {
        spinner.fail(chalk.red(err));
        reject(err);
        return
      }
      spinner.succeed(chalk.green("拉取成功！"));
      reslove();
    })
  })
}