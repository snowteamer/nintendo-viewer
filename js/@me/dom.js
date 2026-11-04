import { throwNewAssertionError } from "@me/tc.js";

export let main = /**@type HTMLDivElement */ (document.getElementById("main")) ?? throwNewAssertionError()
export let ribbon = /**@type HTMLDivElement */ (document.getElementById("ribbon")) ?? throwNewAssertionError()
export let tb = /**@type HTMLTableElement */ (document.getElementById("sheet")) ?? throwNewAssertionError()
export let tBody = tb.tBodies[0] ?? tb.createTBody() ?? throwNewAssertionError()
export let tHead = tb.tHead ?? tb.createTHead() ?? throwNewAssertionError()
