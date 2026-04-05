---
name: api-design
description: REST API design principles, DTOs, error handling, pagination, versioning, and API documentation. Triggers on tasks involving API endpoints, request/response design, or backend API structure.
---

# API Design

## Overview

Guidelines for designing robust, consistent, and developer-friendly REST APIs.

## Trigger

Activate when:
- Designing new API endpoints
- Creating DTOs and schemas
- Error handling patterns
- API versioning
- Documentation
- Rate limiting

## REST Principles

### Resource Naming

```
GET    /users          - List users
GET    /users/:id      - Get single user
POST   /users          - Create user
PUT    /users/:id      - Full update
PATCH  /users/:id      - Partial update
DELETE /users/:id      - Delete user

GET    /users/:id/posts      - User's posts
POST   /users/:id/posts      - Create post for user
```

### HTTP Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable | Validation failed |
| 429 | Too Many Requests | Rate limited |
| 500 | Internal Error | Server error |

## Request/Response Format

### Success Response

```typescript
// Single resource
{
  "data": {
    "id": "123",
    "name": "John",
    "email": "john@example.com"
  },
  "message": "User retrieved successfully"
}

// List with pagination
{
  "data": [
    { "id": "1", "name": "John" },
    { "id": "2", "name": "Jane" }
  ],
  "meta": {
    "current": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  },
  "message": "Users retrieved successfully"
}
```

### Error Response

```typescript
// Validation error
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ]
}

// Single error
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

## Pagination

### Cursor-Based (Recommended for large datasets)

```typescript
// Request
GET /posts?cursor=eyJpZCI6MTIzfQ&limit=20

// Response
{
  "data": [...],
  "meta": {
    "nextCursor": "eyJpZCI6MTQzfQ",
    "hasMore": true
  }
}
```

### Offset-Based

```typescript
// Request
GET /posts?page=1&limit=20

// Response
{
  "data": [...],
  "meta": {
    "current": 1,
    "pageSize": 20,
    "total": 1000,
    "totalPages": 50
  }
}
```

## Filtering & Sorting

### Query Parameters

```
GET /posts?status=published&author=123&sort=createdAt:desc&fields=id,title
```

### Filter Options

```typescript
// Multiple values
GET /posts?tags=javascript,typescript

// Range
GET /posts?createdAt[gte]=2024-01-01&createdAt[lte]=2024-12-31

// Search
GET /posts?q=search+term
```

## DTO Design

### Create DTO

```typescript
class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  tags: string[];

  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;
}
```

### Update DTO

```typescript
class UpdatePostDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;
}
```

### Response DTO

```typescript
class PostResponseDto {
  id: string;
  title: string;
  content: string;
  author: AuthorResponseDto;
  tags: string[];
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(post: Post): PostResponseDto {
    const dto = new PostResponseDto();
    dto.id = post.id;
    dto.title = post.title;
    // ... map fields
    return dto;
  }
}
```

## Versioning

### URL Path (Recommended)

```
/api/v1/users
/api/v2/users
```

### Query Parameter

```
/api/users?version=2
```

### Header

```
Accept: application/vnd.api.v2+json
```

## Authentication

### Bearer Token

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### API Key

```
X-API-Key: your-api-key
```

## Rate Limiting

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Best Practices

### DO

```typescript
// ✅ Use consistent naming
GET /user-profiles
POST /user-profiles
PUT /user-profiles/:id

// ✅ Use plural nouns
GET /users (not /user)

// ✅ Use kebab-case
GET /user-profiles (not /userProfiles)

// ✅ Return appropriate status codes
201 Created after POST
204 No Content after DELETE

// ✅ Include helpful messages
{ "message": "User created successfully" }
```

### DON'T

```typescript
// ❌ Don't use verbs in endpoints
POST /createUser (use POST /users)

// ❌ Don't nest too deep
GET /users/123/posts/456/comments/789 (max 2 levels)

// ❌ Don't return raw database IDs
{ "id": ObjectId("...") } // Use string IDs

// ❌ Don't mix naming conventions
/users/getUser (inconsistent)
```

## Documentation

### OpenAPI/Swagger

```yaml
openapi: 3.0.0
info:
  title: SocialBook API
  version: 1.0.0
  description: API documentation for SocialBook

paths:
  /users:
    get:
      summary: List users
      tags: [Users]
      parameters:
        - name: page
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
```

## Error Codes

### Structured Error Codes

```typescript
// Enum for error codes
enum ErrorCode {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMITED = 'RATE_LIMITED',
}

// Error response
{
  "statusCode": 404,
  "message": "User not found",
  "errorCode": "USER_NOT_FOUND",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
