# 7Pay 二维码支付集成指南

本文档详细说明如何在项目中集成 7Pay 支付系统，特别是二维码支付模式，包括轮询和主动查询支付状态的完整实现。

## 目录

- [环境配置](#环境配置)
- [支付流程概览](#支付流程概览)
- [核心功能实现](#核心功能实现)
  - [1. 创建订单](#1-创建订单)
  - [2. 发起支付（二维码模式）](#2-发起支付二维码模式)
  - [3. 轮询查询支付状态](#3-轮询查询支付状态)
  - [4. 主动同步订单状态](#4-主动同步订单状态)
  - [5. 支付回调处理](#5-支付回调处理)
- [签名算法](#签名算法)
- [前端集成示例](#前端集成示例)
- [注意事项](#注意事项)

---

## 环境配置

### 1. 配置环境变量

在 `.prod.vars`（生产环境）或 `.dev.vars`（开发环境）中添加以下配置：

```bash
# 7Pay 商户配置
ZPAY_PID=2025061712102184              # 商户ID
ZPAY_KEY=X9FObSPn1ZiYPzqoEyHh0qZYSlykLicg  # 商户密钥
C_ID=1234                               # 支付渠道ID（可选，不填则随机使用某一支付渠道）
```

### 2. 环境变量说明

| 变量名 | 说明 | 是否必填 | 示例值 |
|--------|------|----------|--------|
| `ZPAY_PID` | 7Pay 商户唯一标识 | 是 | 2025061712102184 |
| `ZPAY_KEY` | 7Pay 商户密钥，用于签名验证 | 是 | X9FObSPn1ZiYPzqoEyHh0qZYSlykLicg |
| `C_ID` | 支付渠道 ID，指定使用特定收款通道 | 否 | 1234 |

### 3. 推送环境变量到 Cloudflare

```bash
# 推送到生产环境
bun run env:push:prod

# 推送到测试环境
bun run env:push:staging
```

---

## 支付流程概览

```
┌─────────┐
│ 用户    │
└────┬────┘
     │
     │ 1. 点击支付
     ▼
┌─────────────────┐
│ 前端创建订单     │ POST /api/membership/purchase
└────┬────────────┘     mode=qr
     │
     │ 2. 返回订单信息 + 二维码
     ▼
┌─────────────────┐
│ 后端调用 7Pay   │ POST https://zpayz.cn/mapi.php
│ 获取支付二维码   │
└────┬────────────┘
     │
     │ 3. 展示二维码
     ▼
┌─────────────────┐
│ 前端显示二维码   │ 使用 img 或 qrcode 字段
│ 开始轮询状态     │
└────┬────────────┘
     │
     │ 4. 每3秒轮询
     ▼
┌─────────────────┐
│ 查询订单状态     │ GET /api/orders/:id
└────┬────────────┘
     │
     │ 5. 每15秒主动同步
     ▼
┌─────────────────┐
│ 同步支付状态     │ POST /api/orders/:id/sync
└────┬────────────┘     查询 7Pay API
     │
     │ 6. 用户扫码支付
     ▼
┌─────────────────┐
│ 7Pay 异步回调   │ POST /api/payment/notify
└────┬────────────┘
     │
     │ 7. 更新订单状态
     ▼
┌─────────────────┐
│ 激活会员/服务    │
└────┬────────────┘
     │
     │ 8. 前端检测到 paid
     ▼
┌─────────────────┐
│ 跳转结果页面     │ /payment/result/:orderId
└─────────────────┘
```

---

## 核心功能实现

### 1. 创建订单

**接口路径**: `POST /api/orders/create`

**代码位置**: `src/server/modules/orders/orders.routes.ts:24-151`

**请求参数**:

```typescript
{
  type: "membership" | "addon",
  itemId: string,           // 套餐ID或增值服务ID
  paymentMethod: "alipay" | "wxpay",
  paymentProvider: "zpay",
  couponCode?: string       // 可选优惠码
}
```

**核心逻辑**:

```typescript
// 1. 验证用户身份
const currentUser = c.get("user");

// 2. 查询商品信息（套餐或增值服务）
const tier = await db.query.membershipTiers.findFirst({
  where: eq(membershipTiers.id, parsed.itemId)
});

// 3. 生成订单号
const orderNo = `M${Date.now()}${nanoid(6)}`;

// 4. 处理优惠码（如果有）
let amount = tier.price; // 价格单位：分
if (couponCode) {
  // 验证并应用优惠码
  const deduct = Math.min(amount, cpn.amount);
  amount = Math.max(0, amount - deduct);
}

// 5. 创建订单
const [order] = await db.insert(ordersTable).values({
  id: nanoid(),
  orderNo,
  userId: currentUser.id,
  type: "membership",
  itemId: tier.id,
  itemName: tier.displayName || tier.name,
  amount,                              // 单位：分
  displayAmount: (amount / 100).toFixed(2), // 单位：元
  currency: "CNY",
  status: "pending",
  paymentMethod: parsed.paymentMethod,
  paymentProvider: "zpay",
  expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟过期
  metadata: JSON.stringify({ coupon: appliedCoupon })
}).returning();
```

**返回示例**:

```json
{
  "order": {
    "id": "abc123",
    "orderNo": "M1704123456789xyz",
    "amount": 9800,
    "displayAmount": "98.00",
    "status": "pending"
  }
}
```

---

### 2. 发起支付（二维码模式）

**接口路径**: `POST /api/membership/purchase`

**代码位置**: `src/server/modules/membership/membership.routes.ts:200-257`

**请求参数**:

```typescript
{
  tierId: string,
  paymentMethod: "alipay" | "wxpay",
  mode: "qr",              // 指定二维码模式
  couponCode?: string
}
```

**核心实现**:

```typescript
// 1. 创建订单（复用 /api/orders/create 逻辑）
const order = await createOrder({ type: "membership", itemId: tierId, ... });

// 2. 准备 7Pay 请求参数
const origin = new URL(c.req.url).origin;
const params = {
  pid: c.env.ZPAY_PID,                    // 商户ID
  type: order.paymentMethod || "alipay",  // alipay 或 wxpay
  out_trade_no: order.orderNo,            // 商户订单号
  notify_url: `${origin}/api/payment/notify`, // 异步回调地址
  return_url: `${origin}/payment/result/${order.id}`, // 跳转地址（二维码模式不用）
  name: order.itemName,                   // 商品名称
  money: order.displayAmount,             // 金额（元，字符串格式）
  clientip: "",                           // 用户IP（可选）
  device: "pc",                           // 设备类型
  param: order.id,                        // 业务扩展参数（回调时原样返回）
  sign_type: "MD5",
  ...(c.env.C_ID && { cid: c.env.C_ID }) // 支付渠道ID（可选）
};

// 3. 生成签名
const sortedKeys = Object.keys(params).sort();
const sortedParams = sortedKeys
  .filter(k => params[k] !== "" && k !== "sign" && k !== "sign_type")
  .map(k => `${k}=${params[k]}`)
  .join("&");
const signString = sortedParams + c.env.ZPAY_KEY;
const { createHash } = await import("node:crypto");
const sign = createHash("md5")
  .update(signString)
  .digest("hex")
  .toLowerCase();

// 4. 调用 7Pay mapi.php 接口（二维码模式）
const form = new FormData();
for (const [k, v] of Object.entries(params)) {
  form.append(k, v);
}
form.append("sign", sign);

const resp = await fetch("https://zpayz.cn/mapi.php", {
  method: "POST",
  body: form
});

const result = await resp.json();

// 5. 保存 7Pay 返回的订单号
await db.update(orders).set({
  providerTradeNo: result?.trade_no,
  notifyData: JSON.stringify(result)
}).where(eq(orders.id, order.id));

// 6. 返��订单信息和二维码数据
return c.json({
  order,
  mapi: result  // 包含 qrcode、img、payurl 等字段
}, 201);
```

**7Pay mapi.php 返回格式**:

```json
{
  "code": 1,
  "msg": "success",
  "trade_no": "20160806151343349",  // 7Pay订单号
  "O_id": "123456",                  // 内部订单ID
  "qrcode": "https://xxx.cn/pay/wxpay/202010903/",  // 二维码链接
  "img": "https://z-pay.cn/qrcode/123.jpg",         // 二维码图片
  "payurl": "https://xxx.cn/pay/wxpay/202010903/"   // 支付跳转链接
}
```

---

### 3. 轮询查询支付状态

**接口路径**: `GET /api/orders/:id`

**代码位置**: `src/server/modules/orders/orders.routes.ts:518-562`

**前端轮询实现**:

代码位置: `src/client/routes/cart.tsx:137-168`

```typescript
const startPolling = (orderId: string) => {
  if (polling) clearInterval(polling);

  let attempts = 0;
  const id = window.setInterval(async () => {
    try {
      // 每3秒查询一次订单状态
      const r = await fetch(`/api/orders/${orderId}`, {
        credentials: "include"
      });
      const j = await r.json();

      // 检测支付成功
      if (j?.order?.status === "paid") {
        clearInterval(id);
        setPolling(null);
        window.location.href = `/payment/result/${orderId}`;
        return;
      }

      // 检测订单取消
      if (j?.order?.status === "cancelled") {
        clearInterval(id);
        setPolling(null);
        setError("订单已超时取消，请重新下单");
        return;
      }

      attempts++;

      // 每5次轮询（约15秒）主动同步一次
      if (attempts % 5 === 0) {
        await fetch(`/api/orders/${orderId}/sync`, {
          method: "POST",
          credentials: "include"
        });
      }
    } catch (err) {
      console.error("轮询失败:", err);
    }
  }, 3000); // 3秒间隔

  setPolling(id);
};
```

**后端查询逻辑**:

```typescript
// 1. 查询订单
let order = await db.query.orders.findFirst({
  where: and(
    eq(ordersTable.id, id),
    eq(ordersTable.userId, currentUser.id)
  )
});

// 2. 自动取消过期订单
if (order.status === "pending" &&
    order.expiresAt &&
    order.expiresAt < new Date()) {
  await db.update(ordersTable).set({
    status: "cancelled",
    cancelledAt: new Date(),
    updatedAt: new Date()
  }).where(eq(ordersTable.id, order.id));

  // 重新查询更新后的订单
  order = await db.query.orders.findFirst({
    where: eq(ordersTable.id, id)
  });
}

return c.json({ order });
```

---

### 4. 主动同步订单状态

**接口路径**: `POST /api/orders/:id/sync`

**代码位置**: `src/server/modules/orders/orders.routes.ts:379-516`

**用途**: 当 7Pay 回调延迟或失败时，通过主动查询 7Pay API 来更新订单状态。

**核心实现**:

```typescript
// 1. 验证订单
const order = await db.query.orders.findFirst({
  where: and(
    eq(ordersTable.id, id),
    eq(ordersTable.userId, currentUser.id)
  )
});

// 2. 已支付订单直接返回
if (order.status === "paid") {
  return c.json({ order });
}

// 3. 自动取消过期订单
if (order.status === "pending" &&
    order.expiresAt &&
    order.expiresAt < new Date()) {
  await db.update(ordersTable).set({
    status: "cancelled",
    cancelledAt: now,
    updatedAt: now
  }).where(eq(ordersTable.id, order.id));

  return c.json({ order: updated });
}

// 4. 查询 7Pay 订单状态
const url = `https://zpayz.cn/api.php?act=order&pid=${encodeURIComponent(c.env.ZPAY_PID)}&key=${encodeURIComponent(c.env.ZPAY_KEY)}&out_trade_no=${encodeURIComponent(order.orderNo)}`;

const resp = await fetch(url);
const data = await resp.json();

// 5. 检查支付状态
if (data?.code === 1 && (data?.status === 1 || data?.status === "1")) {
  // 5.1 更新订单状态为已支付
  await db.update(ordersTable).set({
    status: "paid",
    paidAt: new Date(),
    providerTradeNo: data?.trade_no,
    notifyData: JSON.stringify(data)
  }).where(eq(ordersTable.id, order.id));

  // 5.2 增加优惠码使用次数
  if (order.metadata) {
    const meta = JSON.parse(order.metadata || "{}");
    const couponId = meta?.coupon?.couponId;
    if (couponId) {
      await db.update(couponsTable)
        .set({ usedCount: sql`used_count + 1` })
        .where(eq(couponsTable.id, couponId));
    }
  }

  // 5.3 激活会员（如果是会员订单）
  if (order.type === "membership") {
    const tier = await db.query.membershipTiers.findFirst({
      where: eq(membershipTiers.id, order.itemId)
    });

    if (tier) {
      // 查询当前会员状态
      const current = await db.query.userMemberships.findFirst({
        where: and(
          eq(userMemberships.userId, order.userId),
          eq(userMemberships.status, "active")
        ),
        orderBy: (m, { desc }) => [desc(m.endDate)]
      });

      // 计算会员开始和结束日期
      const now = new Date();
      const startDate = (current && current.tierId === tier.id && current.endDate > now)
        ? current.endDate  // 续费：从当前结束时间开始
        : now;             // 新购：从现在开始

      const endDate = new Date(startDate.getTime());
      endDate.setDate(endDate.getDate() + tier.duration);

      // 创建会员记录
      const [membership] = await db.insert(userMemberships).values({
        id: nanoid(),
        userId: order.userId,
        tierId: tier.id,
        status: "active",
        startDate,
        endDate,
        autoRenew: false,
        orderId: order.id,
        source: "purchase"
      }).returning();

      // 更新用户表
      await db.update(userTable).set({
        currentMembershipId: membership.id,
        membershipStatus: "active",
        membershipUpdatedAt: new Date(),
        verified: true,
        // 同步配额
        maxKnowledgeBases: tier.maxKnowledgeBases,
        maxAgents: tier.maxAgents,
        maxSessions: tier.maxSessions,
        maxKbDocuments: tier.maxKbDocuments,
        maxKbDocumentsSizeMB: tier.maxKbDocumentsSizeMB,
        maxKbWebPages: tier.maxKbWebPages,
        maxKbWebPagesSizeMB: tier.maxKbWebPagesSizeMB,
        maxKbPerAgent: tier.maxKbPerAgent
      }).where(eq(userTable.id, order.userId));
    }
  }
}

return c.json({ order: updated });
```

**7Pay 查询接口返回格式**:

```json
{
  "code": 1,
  "msg": "查询订单号成功！",
  "trade_no": "2016080622555342651",
  "out_trade_no": "20160806151343349",
  "type": "alipay",
  "pid": "20220715225121",
  "addtime": "2016-08-06 22:55:52",
  "endtime": "2016-08-06 22:55:52",
  "name": "VIP会员",
  "money": "1.00",
  "status": 1,  // 1=已支付, 0=未支付
  "param": "",
  "buyer": ""
}
```

---

### 5. 支付回调处理

**接口路径**: `POST /api/payment/notify` 和 `GET /api/payment/notify`

**代码位置**: `src/server/modules/payment/payment.routes.ts:16-327`

**说明**: 7Pay 支持 GET 和 POST 两种回调方式，系统同时支持两种。

**核心实现**:

```typescript
// 1. 解析回调参数（GET 用 query，POST 用 form-data）
const payload: Record<string, string> = {};
// ... 解析参数

const receivedSign = payload.sign;
const outTradeNo = payload.out_trade_no;  // 商户订单号
const tradeNo = payload.trade_no;         // 7Pay订单号
const money = payload.money;              // 金额
const tradeStatus = payload.trade_status; // TRADE_SUCCESS

// 2. 验证签名
const sortedKeys = Object.keys(payload).sort();
const sortedParams = sortedKeys
  .filter(k => payload[k] !== "" && k !== "sign" && k !== "sign_type")
  .map(k => `${k}=${payload[k]}`)
  .join("&");
const signString = sortedParams + c.env.ZPAY_KEY;
const { createHash } = await import("node:crypto");
const calculated = createHash("md5")
  .update(signString)
  .digest("hex")
  .toLowerCase();

if (receivedSign.toLowerCase() !== calculated) {
  // 签名验证失败，仍返回 success（避免重复通知）
  return c.text("success");
}

// 3. 查询订单
const order = await db.query.orders.findFirst({
  where: eq(ordersTable.orderNo, outTradeNo)
});

if (!order) {
  return c.text("success");
}

// 4. 幂等性检查（避免重复处理）
if (order.status === "paid") {
  return c.text("success");
}

// 5. 验证金额
if (order.displayAmount !== money) {
  // 金额不匹配，记录到 notifyData 用于排查
  await db.update(ordersTable).set({
    notifyData: JSON.stringify(payload)
  }).where(eq(ordersTable.id, order.id));
  return c.text("success");
}

// 6. 检查支付状态
if (tradeStatus && tradeStatus !== "TRADE_SUCCESS") {
  // 非成功状态，仅记录
  await db.update(ordersTable).set({
    notifyData: JSON.stringify(payload)
  }).where(eq(ordersTable.id, order.id));
  return c.text("success");
}

// 7. 更新订单状态
await db.update(ordersTable).set({
  status: "paid",
  paidAt: new Date(),
  providerTradeNo: tradeNo,
  notifyData: JSON.stringify(payload)
}).where(eq(ordersTable.id, order.id));

// 8. 增加优惠码使用次数
if (order.metadata) {
  const meta = JSON.parse(order.metadata || "{}");
  const couponId = meta?.coupon?.couponId;
  if (couponId) {
    await db.update(couponsTable)
      .set({ usedCount: sql`used_count + 1` })
      .where(eq(couponsTable.id, couponId));
  }
}

// 9. 激活会员（与 sync 接口逻辑相同）
if (order.type === "membership") {
  // ... 同上 sync 接口的会员激活逻辑
}

// 10. 标记用户已验证
await db.update(userTable).set({
  verified: true,
  updatedAt: new Date()
}).where(eq(userTable.id, order.userId));

// 11. 必须返回纯字符串 "success"
return c.text("success");
```

**回调参数示例**:

```
pid=201901151314084206659771
&name=iphone
&money=5.67
&out_trade_no=201901191324552185692680
&trade_no=2019011922001418111011411195
&param=orderId123
&trade_status=TRADE_SUCCESS
&type=alipay
&sign=ef6e3c5c6ff45018e8c82fd66fb056dc
&sign_type=MD5
```

---

## 签名算法

### 签名生成规则

7Pay 使用 MD5 签名算法确保数据安全：

```typescript
function generateSign(params: Record<string, string>, key: string): string {
  // 1. 将所有参数按 key 的 ASCII 码从小到大排序
  const sortedKeys = Object.keys(params).sort();

  // 2. 过滤并拼接参数
  //    - sign、sign_type 不参与签名
  //    - 空值不参与签名
  const sortedParams = sortedKeys
    .filter(k => params[k] !== "" && k !== "sign" && k !== "sign_type")
    .map(k => `${k}=${params[k]}`)
    .join("&");

  // 3. 拼接商户密钥
  const signString = sortedParams + key;

  // 4. MD5 加密并转小写
  const { createHash } = require("node:crypto");
  const sign = createHash("md5")
    .update(signString)
    .digest("hex")
    .toLowerCase();  // 注意：必须小写

  return sign;
}
```

### 签名验证示例

```typescript
// 接收到的参数
const params = {
  pid: "2025061712102184",
  type: "alipay",
  out_trade_no: "M1704123456789xyz",
  name: "VIP会员",
  money: "98.00",
  // ... 其他参数
};

// 接收到的签名
const receivedSign = "28f9583617d9caf66834292b6ab1cc89";

// 验证
const calculatedSign = generateSign(params, ZPAY_KEY);
const isValid = calculatedSign === receivedSign.toLowerCase();

if (!isValid) {
  console.error("签名验证失败");
}
```

---

## 前端集成示例

### 完整支付流程

```tsx
const [qr, setQr] = useState<{
  img?: string;
  qrcode?: string;
  orderId?: string;
  displayAmount?: string;
} | null>(null);

const [polling, setPolling] = useState<number | null>(null);

// 发起支付
const handlePay = async () => {
  try {
    // 1. 调用支付接口
    const res = await fetch("/api/membership/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        tierId: "tier-pro",
        paymentMethod: "alipay",
        mode: "qr",  // 二维码模式
        couponCode: couponApplied?.code
      })
    });

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();

    // 2. 展示二维码
    setQr({
      img: data?.mapi?.img,           // 优先使用 img（图片地址）
      qrcode: data?.mapi?.qrcode,     // 或使用 qrcode（需前端生成二维码）
      orderId: data?.order?.id,
      displayAmount: data?.order?.displayAmount
    });

    // 3. 开始轮询
    if (data?.order?.id) {
      startPolling(data.order.id);
    }
  } catch (err) {
    console.error("支付失败:", err);
  }
};

// 启动轮询
const startPolling = (orderId: string) => {
  if (polling) clearInterval(polling);

  let attempts = 0;
  const id = window.setInterval(async () => {
    try {
      // 每3秒查询订单状态
      const r = await fetch(`/api/orders/${orderId}`, {
        credentials: "include"
      });
      const j = await r.json();

      // 支付成功
      if (j?.order?.status === "paid") {
        clearInterval(id);
        setPolling(null);
        window.location.href = `/payment/result/${orderId}`;
        return;
      }

      // 订单取消
      if (j?.order?.status === "cancelled") {
        clearInterval(id);
        setPolling(null);
        alert("订单已超时取消，请重新下单");
        return;
      }

      attempts++;

      // 每15秒主动同步一次
      if (attempts % 5 === 0) {
        await fetch(`/api/orders/${orderId}/sync`, {
          method: "POST",
          credentials: "include"
        });
      }
    } catch (err) {
      console.error("轮询失败:", err);
    }
  }, 3000);

  setPolling(id);
};

// 渲染二维码弹窗
{qr && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white rounded p-6 max-w-md w-full">
      <h3 className="text-lg font-medium mb-3">扫码支付</h3>

      <div className="mb-2 text-gray-800">
        应付金额：
        <span className="font-semibold">￥{qr.displayAmount}</span>
      </div>

      {/* 展示二维码 */}
      {qr.img ? (
        <img src={qr.img} alt="qrcode" className="mx-auto w-64 h-64" />
      ) : qr.qrcode ? (
        <img src={qr.qrcode} alt="qrcode" className="mx-auto w-64 h-64" />
      ) : (
        <div className="text-center text-sm text-gray-600">
          已获取支付链接
        </div>
      )}

      <div className="mt-4 text-center text-sm text-gray-500">
        支付成功后会自动跳转结果页
      </div>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          className="bg-gray-700 text-white px-4 py-2 rounded"
          onClick={() => {
            if (polling) clearInterval(polling);
            setPolling(null);
            setQr(null);
          }}
        >
          关闭
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 注意事项

### 1. 安全事项

- **签名验证**: 回调接口必须验证签名，防止伪造通知
- **金额校验**: 必须校验回调金额与订单金额一致
- **幂等性**: 同一订单可能收到多次回调，需要防重复处理
- **HTTPS**: 生产环境必须使用 HTTPS，确保通信安全

### 2. 回调处理

- **必须返回 "success"**: 无论何种情况（成功、失败、签名错误），都必须返回纯字符串 `"success"`，否则 7Pay 会认为通知失败并重复发送
- **重试机制**: 7Pay 的通知频率为 `0/15/15/30/180/1800/1800/1800/1800/3600` 秒
- **超时时间**: 如果商户系统 5 秒内未返回或返回非 "success"，7Pay 会认为通知失败

### 3. 订单状态

- **pending**: 待支付
- **paid**: 已支付
- **cancelled**: 已取消（超过 30 分钟自动取消）

### 4. 轮询优化

- **轮询间隔**: 建议 3 秒，避免过于频繁
- **主动同步**: 每 15 秒调用一次 `/sync` 接口，作为回调的兜底方案
- **停止条件**:
  - 订单状态变为 `paid` 或 `cancelled`
  - 用户关闭支付弹窗
  - 页面卸载时清理定时器

### 5. 环境变量

- **开发环境**: 使用 `.dev.vars`
- **测试环境**: 使用 `.staging.vars`
- **生产环境**: 使用 `.prod.vars`
- **敏感信息**: `ZPAY_KEY` 不能泄露，不要提交到版本控制系统

### 6. 错误处理

```typescript
// 订单过期自动取消
if (order.status === "pending" && order.expiresAt < new Date()) {
  await db.update(ordersTable).set({
    status: "cancelled",
    cancelledAt: new Date()
  }).where(eq(ordersTable.id, order.id));
}

// 签名验证失败（仍返回 success）
if (calculatedSign !== receivedSign) {
  console.error("签名验证失败", { calculatedSign, receivedSign });
  return c.text("success");
}

// 金额不匹配（记录日志）
if (order.displayAmount !== money) {
  await db.update(ordersTable).set({
    notifyData: JSON.stringify(payload)
  }).where(eq(ordersTable.id, order.id));
  return c.text("success");
}
```

---

## 相关文档

- [7Pay 官方文档](https://z-pay.cn/)
- [订单系统设计文档](../orders/membership-order-system-plan.md)
- [会员系统 KISS 方案](../orders/membership-kiss-plan.md)

---

## 更新日志

- **2025-01-07**: 初始版本，包含二维码支付、轮询、主动查询完整流程
