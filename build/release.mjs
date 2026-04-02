#!/usr/bin/env node
/**
 * 跨平台发布脚本（替代 build/release.sh，避免 Windows 下无 sh 的问题）
 */
import { execSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// 执行命令并继承 stdio，便于看到 npm/git 输出
function run(cmd) {
  execSync(cmd, { stdio: 'inherit', encoding: 'utf8' });
}

async function main() {
  const rl = readline.createInterface({ input, output });

  const version = (await rl.question('输入新发布的版本号: ')).trim();
  if (!version) {
    console.log('未输入版本号，已取消');
    rl.close();
    process.exit(1);
  }

  const reply = (await rl.question(`确认发布 ${version} ? (y/n) `)).trim();
  rl.close();

  if (!/^[Yy]$/.test(reply)) {
    console.log('发布取消');
    process.exit(0);
  }

  // 与 release.sh 一致：有未提交改动则提交，否则退出
  const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (status) {
    console.log('\r\n---工作目录不干净，需要提交---\r\n');
    run('git add -A');
    run(`git commit -m "[commit]: ${version}"`);
  } else {
    console.log('\r\n---工作目录没有任何需要提交的内容，不建议生产新的版本---\r\n');
    process.exit(1);
  }

  run(`npm version ${version} --message "[release]: ${version}"`);
  run('git push origin main');
  run(`git push origin refs/tags/v${version}`);
  run('npm publish');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
