#!/usr/bin/env -S deno run --allow-net=:8000 --allow-env=PORT --allow-read=./,./frontend,./libs --import-map=import_map.json --no-check app.ts

import * as pubsub from "@me/pubsub/server.ts";
import router from "./router.ts";

const DEFAULT_PORT = 8000;
const envPort = Deno.env.get("PORT");

const hostname = envPort ? "0.0.0.0" : "localhost";
const port = envPort ? Number(envPort) : DEFAULT_PORT;

if (isNaN(port)) {
  console.error("Port is not a number.");
  Deno.exit(1);
}


const server = new pubsub.PubsubServer({
  messageHandlers: {
    "pub" (_msg) {
    },
    "upload" (msg) {
      const { data } = msg
      const { dirname = "", payload } = JSON.parse(data)
      if (!payload) return new Response("No payload specified.")
      const name = payload?.name
      if (typeof name !== "string" || name === "") throw new Error("The payload must be an object with a 'name' property.")
      Deno.writeTextFile(`./data/${dirname}/${name}.json`, JSON.stringify(payload))
    }
  },
  async httpRequestHandler (request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const route = router.lookup(request.method, pathname);
    if(!route) return new Response('Not found', { status: 404 });
    (request as Request & { params: unknown }).params = route.params;
    const response = await route.handler(request);
    console.log('[backend] response:', response);
    if (response instanceof Error) {
      if (response.name === "NotFound") return new Response('Not found', { status: 404 });
    }
    return response;
  },
  pingInterval: 30_000
});

server.start({ hostname, port });

console.log("server started")

const ua = new Uint8Array(80)

const locals = {}
setTimeout(async function main () {
  await Deno.stdout.write(new TextEncoder().encode("deno> "))
  const n = await Deno.stdin.read(ua)
  if (!n) return
  const code = new TextDecoder().decode(ua.buffer.slice(0, n))
  if(code) try {
    console.log(await eval(code, undefined, locals))
  } catch (err) {
    console.error(err)
  }
  setTimeout(main, 0)
}, 0)
