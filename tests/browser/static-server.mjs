import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const publicRoot = path.resolve(
  repositoryRoot,
  process.env.PORTFOLIO_STATIC_ROOT ?? "dist/client",
);
const host = process.env.HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.PORT ?? "4173", 10);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function writePlainText(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-type": "text/plain; charset=utf-8",
    ...headers,
  });
  response.end(body);
}

function resolveRequestCandidates(requestUrl) {
  let pathname;

  try {
    pathname = decodeURIComponent(new URL(requestUrl, `http://${host}:${port}`).pathname);
  } catch {
    return null;
  }

  if (pathname.includes("\0")) {
    return null;
  }

  const portablePath = pathname.replaceAll("\\", "/");
  const segments = portablePath.split("/").filter(Boolean);

  if (segments.some((segment) => segment === "..")) {
    return null;
  }

  const requestedPath = path.resolve(publicRoot, ...segments);
  const relativePath = path.relative(publicRoot, requestedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  if (segments.length === 0 || portablePath.endsWith("/")) {
    return [path.join(requestedPath, "index.html")];
  }

  if (path.extname(requestedPath)) {
    return [requestedPath];
  }

  return [requestedPath, path.join(requestedPath, "index.html"), `${requestedPath}.html`];
}

async function findFile(candidates) {
  for (const candidate of candidates) {
    try {
      const candidateStat = await stat(candidate);

      if (candidateStat.isFile()) {
        return { filePath: candidate, size: candidateStat.size };
      }

      if (candidateStat.isDirectory()) {
        const indexPath = path.join(candidate, "index.html");
        const indexStat = await stat(indexPath);

        if (indexStat.isFile()) {
          return { filePath: indexPath, size: indexStat.size };
        }
      }
    } catch (error) {
      if (error?.code !== "ENOENT" && error?.code !== "ENOTDIR") {
        throw error;
      }
    }
  }

  return null;
}

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error(`Invalid PORT value: ${process.env.PORT ?? "4173"}`);
}

const rootStat = await stat(publicRoot).catch(() => null);

if (!rootStat?.isDirectory()) {
  throw new Error(`Static output directory does not exist: ${publicRoot}`);
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    writePlainText(response, 405, "Method not allowed\n", { allow: "GET, HEAD" });
    return;
  }

  const candidates = resolveRequestCandidates(request.url ?? "/");

  if (!candidates) {
    writePlainText(response, 400, "Bad request\n");
    return;
  }

  try {
    const asset = await findFile(candidates);

    if (!asset) {
      writePlainText(response, 404, "Not found\n");
      return;
    }

    response.writeHead(200, {
      "cache-control": "no-store",
      "content-length": asset.size,
      "content-type": contentTypes.get(path.extname(asset.filePath).toLowerCase())
        ?? "application/octet-stream",
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    const stream = createReadStream(asset.filePath);
    stream.on("error", () => {
      if (!response.headersSent) {
        writePlainText(response, 500, "Internal server error\n");
      } else {
        response.destroy();
      }
    });
    stream.pipe(response);
  } catch (error) {
    console.error(error);
    writePlainText(response, 500, "Internal server error\n");
  }
});

server.listen(port, host, () => {
  console.log(`Portfolio static server ready at http://${host}:${port}`);
});

function stopServer() {
  server.close((error) => {
    process.exitCode = error ? 1 : 0;
  });
}

process.once("SIGINT", stopServer);
process.once("SIGTERM", stopServer);
