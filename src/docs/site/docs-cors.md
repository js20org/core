# CORS
$$ meta:title JS20 - CORS
$$ meta:description Learn how JS20 handles CORS (Cross-Origin Resource Sharing) and how to configure it.

JS20 allows you to pass along **allowedOrigins** in the **server** config of the app. By default, if no origins are provided, it will allow all origins with __access-control-allow-origin: \*__.

If you want to provide your own list of allowed origins, you can do so like this:

$$ import ./src/examples/raw/cors.ts
