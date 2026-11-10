# 手动启动器

本项目不注册开机启动项或后台服务。启动器直接在当前 Node 进程内运行 Vite，只监听本机 `127.0.0.1`。

## 首次准备

Windows 和 Linux 均需安装 Node.js **24 LTS** 与 pnpm。在仓库目录执行一次：

```sh
pnpm install --frozen-lockfile
```

Windows 需自行安装 Windows 版依赖；不要从 Linux 复制 `node_modules`。

云端沙箱若无法写入默认缓存目录，使用：

```sh
XDG_DATA_HOME=/workspace/.cache/data XDG_CACHE_HOME=/workspace/.cache pnpm install --frozen-lockfile --store-dir /workspace/.cache/pnpm-store
```

## 启动和停止

- Windows：双击根目录的 `launch.cmd`。
- Linux：在终端运行 `./launch.sh`（也可 `bash launch.sh`）。
- 启动后自动打开默认浏览器；若没有打开，使用终端打印的地址。
- **停止：在启动器窗口按 Enter 或 Ctrl+C，或关闭该终端窗口。** 只关闭浏览器标签页不会停止服务。
- 启动器不另起后台服务器进程；退出即停止监听。浏览器本身可能继续运行。
- 默认端口为 5173。若端口已占用，启动器报错退出，不终止其他程序。可执行 `launch.cmd --port 5174` 或 `./launch.sh --port 5174` 改用端口。
- 测试时可加 `--no-open` 禁止自动打开浏览器。不要使用 `nohup`、`start /b` 或后台守护程序运行启动器。

Linux 已验证 Enter、SIGINT、SIGHUP 后退出并释放端口，以及端口占用时安全退出。Windows 脚本保持 Node 与启动器同一控制台，尚需在真实 Windows 上验证双击及关闭窗口行为。

## 验证

```sh
node --test tests/launcher.test.mjs
pnpm lint
pnpm build
```
