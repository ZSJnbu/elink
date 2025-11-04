## 外链 API 参数说明

以下内容覆盖调用 `/api/external-links` 时需要提供的全部参数，包括 HTTP 头、JSON 请求体字段与示例取值。所有请求均使用 `POST` 方法并发送 `Content-Type: application/json` 的负载。

### 必填 Header

| Header 名称 | 类型 | 说明 |
|-------------|------|------|
| `Content-Type` | `string` | 固定为 `application/json`，表示请求体是 JSON 格式。 |
| `x-token` | `string` | 请求 Token，可在密钥管理或个人“密钥”页面直接复制。 |

### JSON 请求体字段

| 字段 | 类型 | 是否必填 | 说明 |
|------|------|----------|------|
| `accessKey` | `string` | ✅ | 管理后台（或“密钥”页面）颁发的访问密钥。 |
| `text` | `string` | ✅ | 需要进行外链分析的英文文本。 |
| `apiKey` | `string` | ❌ | （可选）调用自定义模型时使用的 API Key；若为空则走服务器内置的 `OPENAI_API_KEY`。 |
| `baseUrl` | `string` | ❌ | （可选）自定义模型的兼容接口地址，使用 HTTP/HTTPS URL。 |
| `model` | `string` | ❌ | （可选）模型名称，如 `gpt-4o-mini` 或 `qwen3-vl-plus`。 |
| `provider` | `"openai"`\|`"custom"` | ❌ | （可选）模型提供方，默认为 `openai`。当设置为 `custom` 时必须携带 `apiKey`，可配合 `baseUrl` 使用。 |
| `fingerprint` | `string` | ❌ | （可选）未登录用户用于限流/识别的指纹 ID。 |
| `blacklist` | `string[]`\|`string` | ❌ | （可选）需要排除的域名，支持字符串数组或逗号分隔的字符串。 |
| `preferredSites` | `string[]`\|`string` | ❌ | （可选）优先推荐的域名，支持字符串数组或逗号分隔的字符串。 |

> `blacklist` 与 `preferredSites` 在数组模式下传递更清晰；如果以字符串传入，会自动按逗号切分并去重。

### 完整示例

```http
POST https://YOUR_DOMAIN/api/external-links
Content-Type: application/json
x-token: YOUR_X_TOKEN

{
  "accessKey": "YOUR_ACCESS_KEY",
  "text": "Search engine optimization is crucial",
  "provider": "custom",
  "model": "qwen3-vl-plus",
  "apiKey": "YOUR_MODEL_API_KEY",
  "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "preferredSites": ["moz.com"],
  "blacklist": ["example.com"]
}
```

将 `YOUR_DOMAIN`、`YOUR_X_TOKEN`、`YOUR_ACCESS_KEY` 等占位符替换为实际值即可完成调用。

### 响应字段说明

```json
{
  "success": true,
  "data": {
    "keywords": [
      {
        "keyword": "Search Engine Optimization",
        "query": "What are the best SEO strategies for 2024?",
        "reason": "向读者解释最新 SEO 策略。",
        "link": "https://example.com/best-seo",
        "title": "Best SEO Strategies for 2024",
        "alternatives": {
          "preferred": ["https://moz.com/..."],
          "regular": ["https://ahrefs.com/..."]
        }
      }
    ],
    "usage": {
      "promptTokens": 123,
      "completionTokens": 45,
      "totalTokens": 168
    },
    "linkFetchError": null
  }
}
```

| 字段 | 说明 |
|------|------|
| `success` | 布尔值，表示调用是否成功。 |
| `data.keywords[].keyword` | 关键词文本。 |
| `data.keywords[].query` | 推荐的搜索语句。 |
| `data.keywords[].reason` | 推荐理由。 |
| `data.keywords[].link` | 推荐的主链接，可能为 `null`。 |
| `data.keywords[].title` | 主链接标题。 |
| `data.keywords[].alternatives.preferred` | 优先候选链接数组。 |
| `data.keywords[].alternatives.regular` | 常规候选链接数组。 |
| `data.usage.promptTokens` | 提示词 Token 数。 |
| `data.usage.completionTokens` | 完成 Token 数。 |
| `data.usage.totalTokens` | 总 Token 数。 |
| `data.linkFetchError` | 抓取外链失败时的错误信息；成功时为 `null`。 |
| `error` | 当 `success=false` 时出现，包含 `code`、`message` 与可选 `details`。 |
