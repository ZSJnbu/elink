
#### 接口使用案例

```shell
curl -X POST 'https://elink1.pages.dev/api/external-links' \
  -H 'Content-Type: application/json' \
  -H 'x-token: d4707ce6dd5b79cbad0b65f2b618ad99c4e7c1aa591b6028a72ae3da695dbea3' \
  -d '{
    "text": "Search engine optimization is crucial",
    "model": "qwen3-vl-plus",
    "apiKey": "sk-437c9b4256314c7fa0b0e383021ae453",
    "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "provider": "custom",
    "accessKey": "1bcfd7dc7fa507c974e08777c607e9053002f1d9f414a6595b02dd952bef747b"
  }'
```


```shell
#当需要代理访问时
curl --proxy <代理的IP:代理端口> -X POST 'https://elink1.pages.dev/api/external-links' \
  -H 'Content-Type: application/json' \
  -H 'x-token: d4707ce6dd5b79cbad0b65f2b618ad99c4e7c1aa591b6028a72ae3da695dbea3' \
  -d '{
    "text": "Search engine optimization is crucial",
    "model": "qwen3-vl-plus",
    "apiKey": "sk-437c9b4256314c7fa0b0e383021ae453",
    "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "provider": "custom",
    "accessKey": "1bcfd7dc7fa507c974e08777c607e9053002f1d9f414a6595b02dd952bef747b"
  }'
```

#### 接口参数说明
| 参数 | 是否必填 | 说明 |
|------|:----:|------|
| text | ✅ | 需要进行外链分析的文本 |
| model | ✅ | 需要使用的模型 |
| apiKey | ✅ | 大模型的访问Key |
| baseUrl | ✅ | 大模型的的Url |
| provider | ✅ | 值一直为custom即可 |
| accessKey | ✅ | elink后台获得的Key |

> Header 中必须额外携带 `x-token`。其内容为授权邮箱执行 MD5 后，再使用 SHA256 生成的签名，可直接在密钥管理页面的“查看密钥”弹窗中复制。
