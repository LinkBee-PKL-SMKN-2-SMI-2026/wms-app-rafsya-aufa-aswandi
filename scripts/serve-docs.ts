import { serve } from "bun";
import { fileURLToPath } from "url";
import { join } from "path";

const PORT = parseInt(process.env.DOCS_PORT || "3001", 10);
const DOCS_DIR = fileURLToPath(new URL("../docs/bundle", import.meta.url));

serve({
  port: PORT,
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === "/openapi.yaml") {
      const file = Bun.file(join(DOCS_DIR, "openapi.yaml"));
      if (await file.exists()) {
        return new Response(file, {
          headers: { "Content-Type": "application/yaml" },
        });
      }
      return new Response("openapi.yaml not found. Run bun run bundle:docs first.", { status: 404 });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest/dist/browser/standalone.css" />
</head>
<body>
  <div id="app"></div>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest/dist/browser/standalone.js"></script>
  <script>
    Scalar.createApiReference('#app', {
      theme: 'purple',
      url: '/openapi.yaml',
    });
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
});

console.log(`\n📖 Docs served at: http://localhost:${PORT}\n`);