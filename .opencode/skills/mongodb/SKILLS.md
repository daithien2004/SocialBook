---
name: mongodb-query-optimizer
description: >
  Optimize MongoDB queries and aggregation pipelines for performance. Use this skill whenever the user
  shares MongoDB queries, find() calls, aggregation pipelines, or describes slow query issues.
  Trigger on keywords like: "query chậm", "optimize mongo", "index mongodb", "aggregation pipeline",
  "explain plan", "full collection scan", "COLLSCAN", "query tdung", "tối ưu query", "mongo slow",
  "compound index", "$match", "$lookup", "$group", "$sort", "tạo index".
  Always use this skill when reviewing or rewriting any MongoDB code — even if the user doesn't
  explicitly say "optimize". If there's a MongoDB query in the conversation, this skill applies.
---

# MongoDB Query Optimization Skill

## Mục tiêu

Phân tích và tối ưu MongoDB query / aggregation pipeline: giảm documents scanned, tránh COLLSCAN,
thiết kế index đúng, sắp xếp pipeline stage hợp lý.

---

## Quy trình chuẩn khi nhận query cần tối ưu

1. **Đọc query** → xác định loại: `find()`, `aggregate()`, hay cả hai
2. **Phát hiện anti-pattern** (xem danh sách bên dưới)
3. **Đề xuất index** theo ESR rule
4. **Viết lại query/pipeline** nếu cần
5. **Giải thích lý do** bằng tiếng Việt, ngắn gọn
6. **Cung cấp lệnh `explain()`** để user tự verify

---

## ESR Rule — Nguyên tắc vàng thiết kế Compound Index

```
Equality → Sort → Range
```

- **E (Equality)**: Fields dùng `=` / `$eq` → đặt **đầu tiên**
- **S (Sort)**: Fields trong `.sort()` / `$sort` → đặt **thứ hai**
- **R (Range)**: Fields dùng `$gt`, `$lt`, `$gte`, `$lte`, `$in`, `$regex` → đặt **cuối**

### Ví dụ thực tế

```js
// Query:
db.orders
  .find({
    status: 'active', // Equality
    createdAt: { $gte: ISODate('2024-01-01') }, // Range
  })
  .sort({ price: 1 }); // Sort

// ❌ Index SAI thứ tự:
db.orders.createIndex({ createdAt: 1, status: 1, price: 1 });

// ✅ Index ĐÚNG theo ESR:
db.orders.createIndex({ status: 1, price: 1, createdAt: 1 });
//                       ^ E         ^ S        ^ R
```

---

## Anti-patterns phổ biến & cách fix

### 1. Không có index → COLLSCAN

```js
// ❌ Scan toàn bộ collection
db.users.find({ email: 'foo@bar.com' });

// ✅ Tạo index
db.users.createIndex({ email: 1 }, { unique: true });
```

### 2. $match không ở đầu pipeline

```js
// ❌ $match sau $lookup → lookup toàn bộ trước rồi mới filter
[
  { $lookup: { from: "orders", ... } },
  { $match: { status: "active" } }  // quá muộn!
]

// ✅ $match trước để giảm documents ngay từ đầu
[
  { $match: { status: "active" } },  // dùng được index
  { $lookup: { from: "orders", ... } }
]
```

### 3. Fetch toàn bộ fields khi chỉ cần một số

```js
// ❌ Trả về toàn bộ document
db.products.find({ category: 'phone' });

// ✅ Projection chỉ lấy fields cần thiết → covered query nếu đủ index
db.products.find({ category: 'phone' }, { name: 1, price: 1, _id: 0 });
```

### 4. $sort không có index → in-memory sort (chậm, tốn RAM)

```js
// ❌ Sort không có index hỗ trợ
db.logs.aggregate([{ $sort: { createdAt: -1 } }]);

// ✅ Đảm bảo index bao gồm sort field
db.logs.createIndex({ createdAt: -1 });
```

### 5. $unwind + $group thay vì dùng array operators

```js
// ❌ $unwind mở rộng documents rất nhiều
[{ $unwind: '$tags' }, { $group: { _id: '$tags', count: { $sum: 1 } } }];

// ✅ Dùng $unwind chỉ khi thực sự cần join với stage khác
// Với trường hợp đơn giản, cân nhắc $reduce hoặc restructure data model
```

### 6. $lookup không có index trên foreignField

```js
// $lookup chậm nếu không có index
{ $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } }

// ✅ Đảm bảo foreignField có index (thường _id đã có, nhưng các field khác thì không)
db.users.createIndex({ externalId: 1 })
```

### 7. Dùng $where hoặc JavaScript expression

```js
// ❌ Không dùng được index, chạy JS cho từng document
db.col.find({ $where: 'this.price > 100' });

// ✅ Dùng native operators
db.col.find({ price: { $gt: 100 } });
```

### 8. Negation operators ($ne, $nin) trên indexed fields

```js
// ❌ $ne / $nin rất kém hiệu quả với index
db.orders.find({ status: { $ne: 'cancelled' } });

// ✅ Nếu có thể, đảo logic thành equality
db.orders.find({ status: { $in: ['active', 'pending', 'shipped'] } });
```

---

## Thứ tự stage tối ưu cho Aggregation Pipeline

```
$match (indexed)
  → $sort (indexed, nếu cần)
  → $limit / $skip
  → $lookup (sau khi đã filter)
  → $unwind (chỉ khi cần)
  → $group
  → $project (cuối cùng)
  → $limit (output)
```

**Tip**: Sau `$sort`, nếu có `$limit`, MongoDB tự gộp thành một bước duy nhất → rất nhanh.

---

## Covered Query — Query nhanh nhất có thể

Một query được "covered" khi **tất cả fields** trong filter + projection đều nằm trong index.
MongoDB không cần đọc document thực → chỉ đọc index.

```js
// Index: { category: 1, price: 1 }
db.products.find(
  { category: 'phone' }, // field trong index ✅
  { price: 1, _id: 0, category: 1 }, // chỉ trả fields trong index ✅
);
// → Covered query, không đọc document nào
```

---

## Lệnh explain() để kiểm tra

```js
// Kiểm tra một find()
db.collection.find({ ... }).explain("executionStats")

// Kiểm tra aggregation
db.collection.explain("executionStats").aggregate([...])
```

### Đọc kết quả explain — những con số quan trọng

| Field                 | Ý nghĩa              | Ngưỡng cảnh báo                     |
| --------------------- | -------------------- | ----------------------------------- |
| `totalDocsExamined`   | Số docs phải đọc     | >> `nReturned` → thiếu index        |
| `totalKeysExamined`   | Số index keys đọc    | >> `nReturned` → index chưa optimal |
| `executionTimeMillis` | Thời gian thực thi   | > 100ms → cần optimize              |
| `stage: "COLLSCAN"`   | Scan toàn collection | Luôn cần fix                        |
| `stage: "IXSCAN"`     | Dùng index           | Tốt ✅                              |

---

## Các loại index phổ biến

```js
// Single field
db.col.createIndex({ field: 1 }); // 1 = asc, -1 = desc

// Compound (theo ESR rule)
db.col.createIndex({ eq_field: 1, sort_field: 1, range_field: 1 });

// Unique
db.col.createIndex({ email: 1 }, { unique: true });

// Sparse (chỉ index docs có field đó)
db.col.createIndex({ optionalField: 1 }, { sparse: true });

// TTL (tự xóa document sau N giây)
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });

// Text search
db.articles.createIndex({ title: 'text', body: 'text' });

// Wildcard (khi không biết trước field name)
db.col.createIndex({ 'metadata.$**': 1 });
```

---

## Kiểm tra index hiện tại

```js
// Xem tất cả index của collection
db.collection.getIndexes();

// Xem index nào đang được dùng nhiều
db.collection.aggregate([{ $indexStats: {} }]);

// Tìm slow queries (profiler)
db.setProfilingLevel(2, { slowms: 100 }); // bật profiler
db.system.profile.find().sort({ millis: -1 }).limit(10); // xem slow queries
```

---

## Checklist nhanh khi review MongoDB query

- [ ] Query có dùng index không? (`explain()` → không có COLLSCAN)
- [ ] Compound index theo đúng thứ tự ESR chưa?
- [ ] `$match` ở đầu pipeline chưa?
- [ ] Có projection để tránh fetch toàn bộ document không?
- [ ] `$sort` có index hỗ trợ không?
- [ ] `$lookup` có index trên `foreignField` không?
- [ ] Có `$limit` sau `$sort` để tránh sort toàn bộ collection không?
- [ ] Không dùng `$where` hoặc JavaScript operators?
- [ ] Tránh `$ne` / `$nin` trên indexed fields?

---

## Nguồn tham khảo

- [MongoDB Docs - Query Optimization](https://www.mongodb.com/docs/manual/core/query-optimization/)
- [MongoDB Docs - Aggregation Pipeline Optimization](https://www.mongodb.com/docs/manual/core/aggregation-pipeline-optimization/)
- [ESR Rule Guide](https://blog.jordanfokoua.dev/optimize-mongo-queries-with-esr/)
- [Practical MongoDB Aggregations Book](https://www.practical-mongodb-aggregations.com/guides/performance.html)
