import fs from "fs-extra";
import ora from "ora";
import chalk from "chalk";
import path from "path";
import shell from "shelljs";
import logSymbols from "log-symbols";
import ejs from "ejs";
import { pipeline } from "stream/promises";
import { fileURLToPath } from "url";

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);
const cliRoot = fileURLToPath(new URL(".", import.meta.url)); // 当前文件地址找到项目根目录

function renderTemplate(content, context) {
  return content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    if (context[key] === undefined || context[key] === null) {
      return "";
    }
    return String(context[key]);
  });
}

async function renderTplFiles(context, tplFiles) {
  for (const tplFile of tplFiles) {
    const tplPath = resolveApp(`${tplFile.to}`);
    if (!(await fs.pathExists(tplPath))) {
      continue;
    }
    const content = await fs.readFile(tplPath, "utf-8");
    let rendered;
    let targetPath;

    if (tplPath.endsWith(".ejs")) {
      // EJS 模板：支持条件、循环等逻辑
      rendered = ejs.render(content, context, { filename: tplPath });
      console.log("🚀 ~ renderTplFiles ~ rendered:", rendered)
      targetPath = tplPath.replace(/\.ejs$/, "");
    } else if (tplPath.endsWith(".tpl")) {
      // 轻量占位符替换（与 {{key}} 兼容）
      rendered = renderTemplate(content, context);
      targetPath = tplPath.replace(/\.tpl$/, "");
    } else {
      continue;
    }

    await fs.writeFile(targetPath, rendered, "utf-8");
    await fs.remove(tplPath);
    console.log(logSymbols.success, chalk.green(`渲染模板成功：${path.basename(targetPath)}`));
  }
}

export async function copySharedFiles(filePairs) {
  for (const item of filePairs) {
    const sourcePath = path.resolve(cliRoot, item.from);
    const targetPath = resolveApp(`${item.to}`);
    const targetDir = path.dirname(targetPath);

    if (!(await fs.pathExists(sourcePath))) {
      console.log(logSymbols.warning, chalk.yellow(`模板文件不存在，已跳过：${item.from}`));
      continue;
    }

    await fs.ensureDir(targetDir);
    // await fs.copyFile(sourcePath, targetPath);
    await pipeline(
      fs.createReadStream(sourcePath),
      fs.createWriteStream(targetPath),
    );
    console.log(logSymbols.success, chalk.green(`写入文件成功：${item.to}`));
  }
}

// 删除文件夹
export async function removeDir(dir) {
  const spinner = ora({
    text: `正在删除文件夹${chalk.cyan(dir)}`,
    color: "yellow",
  }).start();

  try {
    await fs.remove(resolveApp(dir));
    spinner.succeed(chalk.green(`删除文件夹 ${chalk.yellow(dir)} 成功`));
  } catch (err) {
    spinner.fail(chalk.red(`删除文件夹 ${chalk.yellow(dir)} 失败`));
    console.log(err);
    return;
  }
}

// 在模板拉取成功后，将自定义的信息写进模板中的 package.json 文件中
export async function changePackageJson(name, info, isIgnore, templateName = "") {
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
    console.log(
      logSymbols.warning,
      chalk.yellow(`自定义修改信息失败！可以去 ${name}/package.json 手动修改`),
    );
    console.log(err);
  }

  // 批量写入共享模板文件
  try {
    const baseFileList = await fs.readdir(path.resolve(cliRoot, "./template/base"));
    const configFileList = await fs.readdir(path.resolve(cliRoot, "./template/configs"));
    const configFileMsg = configFileList.map(item => ({
      from: `./template/configs/${item}`,
      to: item.includes('ci') ? `${name}/.github/workflows/${item}` : `${name}/nginx/default.conf.tpl`,
    }));
    const vscodeFileList = await fs.readdir(path.resolve(cliRoot, "./template/vscode"));
    const vscodeFileMsg = vscodeFileList.map(item => ({
      from: `./template/vscode/${item}`,
      to: `${name}/.vscode/${item}`,
    }));
    const baseFileMsg = baseFileList.map(item => ({
      from: `./template/base/${item}`,
      to: `${name}/${item}`,
    }));
    const allFileMsg = baseFileMsg.concat(configFileMsg).concat(vscodeFileMsg);
    // 将template/base目录下的文件复制到项目根目录
    await copySharedFiles(allFileMsg);

    // 渲染模板文件
    const techStackMap = {
      "vue-webpack-template": {
        tempId: 1,
        framework: "vue",
        buildTool: "webpack",
      },
      "vue-vite-template": {
        tempId: 2,
        framework: "vue",
        buildTool: "vite",
      },
      "react-webpack-template": {
        tempId: 3,
        framework: "react",
        buildTool: "webpack",
      },
      "react-vite-template": {
        tempId: 4,
        framework: "react",
        buildTool: "vite",
      },
    };

    await renderTplFiles(
      {
        projectName: name,
        techStack: techStackMap[templateName],
        nodeVersion: "^20.0.0",
        packageManager: "pnpm",
        outputDir: "dist",
        devPort: "5173",
        apiBaseUrl: "/api",
        nginxPort: "80",
        apiProxyTarget: "http://localhost:3000"
      },
      allFileMsg.filter(
        (item) => item.to.endsWith(".tpl") || item.to.endsWith(".ejs"),
      ),
    );
  } catch (err) {
    console.log(err);
  }
}

export function npmInstall(dir) {
  const spinner = ora("正在安装依赖......").start();
  if (
    shell.exec(`cd ${shell.pwd()}/${dir} && npm install --force -d`).code !== 0
  ) {
    console.log(
      logSymbols.warning,
      chalk.yellow(`安装依赖失败，请手动安装依赖`),
    );
    shell.exit(1);
  }
  spinner.succeed(chalk.green("~~~依赖安装成功~~~"));
}
