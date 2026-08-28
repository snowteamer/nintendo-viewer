import Router from 'pogo/lib/router.ts'
import file from 'pogo/lib/helpers/file.ts';

import * as pathlib from 'path'

const router = new Router()

const route = new Proxy({}, {
  get: function (obj, prop) {
    return function (path: string, handler: Function | Object) {
      router.add({ path, method: prop, handler })
    }
  }
})

// RESTful API routes

route.GET('/books/{title}', async function handler (request, h) {
  try {
    const title = decodeURIComponent(request.params.title)
    const base = pathlib.resolve("../../../Books")
    console.debug("base:", base)
    console.debug(`GET /books/${title}`)

    const response = await file(pathlib.join(base, title), { confine: false })
    response.headers.set('last-modified', new Date().toGMTString())
    return response.toWeb();
  } catch (err) {
    console.log(err)
  }
})

route.GET('/time', function (request, h) {
  request.response.header('cache-control', 'no-store')
  return new Date().toISOString()
})

route.GET('/{filepath*}', async function handler (request, h) {
  try {
    const filepath = decodeURIComponent(request.params.filepath)
    console.debug(`GET /${filepath}`)

    if (filepath.startsWith("assets/")) {
      const base = pathlib.resolve('./')
      const response = await file(pathlib.join(base, filepath))
      response.headers.set('last-modified', new Date().toGMTString())
      return response.toWeb();
    } else {
      const base = pathlib.resolve('./')
      const response = await file(pathlib.join(base, filepath), { confine: false })
      response.headers.set('last-modified', new Date().toGMTString())
      return response.toWeb();
    }
  } catch (err) {
    console.log(err)
  }
})

// SPA routes

route.GET('/', async function (req, h) {
  const stream = await Deno.open('./index.html', { read: true });
  return new Response(stream.readable, { status: 200, headers: { "content-type": "text/html" } });
})

export default router;
