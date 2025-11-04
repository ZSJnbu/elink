
#### 接口使用案例

```shell
curl -X POST 'https://elink1.pages.dev/api/external-links' \
  -H 'Content-Type: application/json' \
  -H 'x-token: d4707ce6dd5b79cbad0b65f2b618ad99c4e7c1aa591b6028a72ae3da695dbea3' \
  -d '{
    "text": "Search engine optimization is crucial",
    "email": "user@example.com",
    "preferredSites": ["moz.com"],
    "blacklist": ["example.com"]
  }'
```


```shell
#当需要代理访问时
curl --proxy <代理的IP:代理端口> -X POST 'https://elink1.pages.dev/api/external-links' \
  -H 'Content-Type: application/json' \
  -H 'x-token: d4707ce6dd5b79cbad0b65f2b618ad99c4e7c1aa591b6028a72ae3da695dbea3' \
  -d '{
    "text": "Search engine optimization is crucial",
    "email": "user@example.com",
    "preferredSites": ["moz.com"],
    "blacklist": ["example.com"]
  }'
```

#### 接口参数说明
| 参数 | 是否必填 | 说明 |
|------|:----:|------|
| email | ✅ | 授权邮箱（需在后台登记），后台会根据邮箱计算访问凭证 |
| text | ✅ | 需要进行外链分析的文本 |
| fingerprint | ❌ | 匿名访客可选指纹，用于限流识别 |
| blacklist | ❌ | 需要排除的域名，支持数组或逗号分隔字符串 |
| preferredSites | ❌ | 优先推荐的域名，支持数组或逗号分隔字符串 |

> Header 中必须额外携带 `x-token`。其内容为授权邮箱执行 MD5 后，再使用 SHA256 生成的签名，可直接在密钥管理页面的“查看密钥”弹窗中复制。

> 模型名称、API Key 与 Base URL 均由后端环境变量统一配置，接口层不再接收相关参数。
