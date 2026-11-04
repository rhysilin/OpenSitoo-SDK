# 第一个静态应用

目标是在 OpenSitoo 客户端的隔离页面中输入文本并得到回显结果。回显使用 text.echo，不调用模型或产生模型费用。需要[App 开发工具包](/downloads)、Node.js 24；运行页面还需要支持本包格式的客户端和账户。客户端由目标环境维护者提供，本站没有公开安装包 URL。

## 1. 创建工程

```powershell
# 目标目录不能存在；工具生成契约、页面与客户端，不需要 Desktop 源码。
node C:/Sitoo/developer-kit/sitoo-app.mjs create C:/dev/hello-app
```

生成 sitoo-app.json 及 payload/index.html、app.js、app.css、client.js。sitoo-app.json 中的 app.manifest.id 为 example.echo；能力 ID 为 echo，bindings.echo 为 text.echo。输入 schema 接受必填 text，最多 2000 字符，不接额外字段。创建成功只代表项目文件存在，尚未安装。

## 2. 读懂并编辑页面代码

将 payload/app.js 改成下面完整内容；index.html 已有 form、input 和 pre 元素，不要改变它们后仍照搬选择器。

```js
import { createAppClient, AppSdkError } from './client.js';
// 宿主在隔离应用页面提供通道；普通网页没有平台会话。
const client = createAppClient();
const form = document.querySelector('form');
const output = document.querySelector('pre');
form.onsubmit = async (event) => {
  event.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    // echo 是包中能力 ID；绑定到无费用的 text.echo。
    const text = String(new FormData(form).get('text') ?? '');
    const reply = await client.invoke('echo', { text });
    output.textContent = JSON.stringify(reply, null, 2);
  } catch (error) {
    // 用安全错误展示行动，不能向用户回显密钥或底层路径。
    output.textContent = error instanceof AppSdkError ? error.code + ': ' + error.message : '调用失败';
  } finally {
    button.disabled = false;
  }
};
// 只释放页面会话与监听；不会撤销已经被宿主接受的业务。
window.addEventListener('pagehide', () => client.dispose(), { once: true });
```

调用时使用包中的能力名，而不是宿主内部方法名。响应以实际绑定的返回值为准；看到输入文本对应的回显即为成功，不要求它返回共享能力的 DurableTask 结构。

## 3. 打包和检查

```powershell
# 输出 .spkg 必须不存在，避免同版本产物被覆盖。
node C:/Sitoo/developer-kit/sitoo-app.mjs pack C:/dev/hello-app C:/dev/hello-app.spkg

# 成功返回 id=example.echo、version=1.0.0 和文件数量，退出码为 0。
node C:/Sitoo/developer-kit/sitoo-app.mjs check C:/dev/hello-app.spkg
```

pack 输出 file、bytes、sha256；check 核对归档结构、字段和内容。通过检查不证明已经安装、登录或授权。不要将私钥、账号令牌或运行数据库放入 payload。

## 4. 在目标客户端运行

开发版客户端：登录后在应用市场使用“加载开发包”，选择刚生成的 .spkg，按界面确认并从已安装应用打开。输入“你好”，点击“调用回显”，在状态区域检查返回文本。

正式客户端不能依赖未签名的开发包入口。由可信维护者按[静态应用打包与发布](/publishing/static-packages)提供可信市场，刷新市场后安装并运行。开发模式和受信发布分别是两条接入方式，创建工具不会建立正式信任。

客户端接入方式尚未准备时，你可以完成创建、编辑、打包、检查；页面运行步骤保留为待执行，不能用双击 HTML 的效果代替宿主验收。

## 5. 排错和下一步

| 现象 | 检查 |
| --- | --- |
| 页面显示但调用超时 | 是否从已安装应用打开；不要用普通浏览器替代 SDK 宿主 |
| INVALID_DATA | 参数是否符合 text 字段 schema，是否误传其他字段 |
| FORBIDDEN/UNSUPPORTED_OPERATION | 是否使用声明的 echo 能力与 text.echo 绑定，客户端版本是否支持 |
| SESSION_CHANGED/DISPOSED | 账户或页面会话失效，重新打开应用并查询原状态 |
| pack 输出文件已存在 | 换一个新输出文件，保留先前可核对的发布物 |

继续阅读[应用契约与命令](/guides/contracts)、[应用页面 SDK](/guides/browser-client)和[配置与数据](/guides/storage)。调用文本或图片服务时需要新的契约、权限和模型配置，不通过改 echo 名称自动获得。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
