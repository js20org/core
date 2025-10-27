# Bypass ACL
$$ meta:title JS20 - User Guide
$$ meta:description JS20

Sometimes you need to bypass ACL checks. For example, if you need an action that calculates reviews for a book based on reviews from **all users** and not just the logged-in user.

$$ import src/examples/raw/bypass.ts

If you run:

```ts
await system.models.review.getAll();

// Query will be
// SELECT * FROM reviews WHERE ownerId = :userId
```

If you instead run:

```ts
await system.bypassAcl.models.review.getAll();

// Query will be
// SELECT * FROM reviews
```

This way you can bypass ACL checks when needed. Obviously, be careful when using this feature, as it can lead to problems if used incorrectly.
