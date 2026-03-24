import https from "node:https";

import express from "express";
import morgan from "morgan";

const app = express();

const PORT = Number(process.env.PORT || 8080);
const TARGET_HOST = "api.clashroyale.com";
const TARGET_BASE_PATH = "/v1";
const ENABLE_CORS = process.env.ENABLE_CORS === "true";
const BODY_LIMIT = process.env.BODY_LIMIT || "10mb";

if (ENABLE_CORS) {
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, Accept"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    next();
  });
}

app.use(morgan("combined"));
app.use(
  express.raw({
    type: "*/*",
    limit: BODY_LIMIT
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/clash", (req, res) => {
  const queryIndex = req.url.indexOf("?");
  const queryString = queryIndex >= 0 ? req.url.slice(queryIndex) : "";
  const upstreamPath = `${TARGET_BASE_PATH}${req.path}${queryString}`;

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];
  delete headers["transfer-encoding"];

  const proxyReq = https.request(
    {
      protocol: "https:",
      hostname: TARGET_HOST,
      port: 443,
      method: req.method,
      path: upstreamPath,
      headers
    },
    (proxyRes) => {
      res.status(proxyRes.statusCode || 502);

      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (typeof value !== "undefined" && key.toLowerCase() !== "transfer-encoding") {
          res.setHeader(key, value);
        }
      }

      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (error) => {
    if (!res.headersSent) {
      res.status(502).json({
        error: "bad_gateway",
        message: error.message
      });
      return;
    }

    res.end();
  });

  if (Buffer.isBuffer(req.body) && req.body.length > 0) {
    proxyReq.write(req.body);
  }

  proxyReq.end();
});

app.listen(PORT, () => {
  console.log(`Clash Royale proxy listening on :${PORT}`);
});
