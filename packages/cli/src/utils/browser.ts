import { exec } from 'node:child_process';

/**
 * 打开默认浏览器访问指定 URL
 */
export async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  let command: string;

  if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else if (platform === 'darwin') {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }

  return new Promise((resolve) => {
    exec(command, (err) => {
      if (err) {
        // 静默失败——用户可手动打开链接
        console.warn(`⚠️  无法自动打开浏览器，请手动访问: ${url}`);
      }
      resolve();
    });
  });
}
