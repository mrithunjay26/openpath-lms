import net from "node:net";
import { PrismaClient } from "@prisma/client";

function readEnvUrl(name) {
  const raw = process.env[name];
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function tcpCheck(host, port, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (ok, detail = "") => {
      socket.destroy();
      resolve({ ok, detail });
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false, "timed out"));
    socket.once("error", (error) => done(false, error.message));
  });
}

const urls = ["DATABASE_URL", "DIRECT_URL"]
  .map((name) => [name, readEnvUrl(name)])
  .filter(([, url]) => url);

for (const [name, url] of urls) {
  const result = await tcpCheck(url.hostname, Number(url.port || 5432));
  console.log(
    `${name}: ${url.hostname}:${url.port || 5432} ${
      result.ok ? "reachable" : `not reachable (${result.detail})`
    }`,
  );
}

const prisma = new PrismaClient();
try {
  await prisma.$queryRaw`select 1`;
  console.log("Prisma query: ok");
} catch (error) {
  console.log(`Prisma query: failed (${error.code || error.name})`);
  console.log(error.message);
} finally {
  await prisma.$disconnect();
}
