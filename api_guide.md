
#### 接口使用案例
```shell
curl 'https://elink1.pages.dev/api/external-links?text=Search%20engine%20optimization%20is%20crucial&model=qwen3-vl-plus&apiKey=sk-437c9b4256314c7fa0b0e383021ae453&baseUrl=https%3A%2F%2Fdashscope.aliyuncs.com%2Fcompatible-mode%2Fv1&provider=custom&accessKey=1bcfd7dc7fa507c974e08777c607e9053002f1d9f414a6595b02dd952bef747b'
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

curl 'http://elink1.pages.dev/api/external-links?\
text=Search%20engine%20optimization%20is%20crucial\
&model=qwen3-vl-plus\
&apiKey=sk-437c9b4256314c7fa0b0e383021ae453\
&baseUrl=https%3A%2F%2Fdashscope.aliyuncs.com%2Fcompatible-mode%2Fv1\
&provider=custom\
&accessKey=1bcfd7dc7fa507c974e08777c607e9053002f1d9f414a6595b02dd952bef747b'
