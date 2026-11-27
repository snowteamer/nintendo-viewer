import * as tc from "@me/tc.js";

/**
 * @typedef {{
 *   type?: 'button' | 'submit' | 'reset';
 *   ariaPressed?: 'true' | 'false' | 'mixed' | null;
 *   ariaExpanded?: 'true' | 'false' | null;
 * }} ButtonLiterals
 */

/**
 * Sets `this: HTMLButtonElement` AND narrows `ev.currentTarget` to `HTMLButtonElement`
 * so you can write clean method shorthand (`onclick(e) { this.textContent = ... }`).
 *
 * @typedef {{
 *   [K in keyof HTMLButtonElement as K extends `on${string}` ? K : never]?:
 *     HTMLButtonElement[K] extends ((this: any, ev: infer E) => infer R) | null
 *       ? ((this: HTMLButtonElement, ev: E & { readonly currentTarget: HTMLButtonElement }) => R) | null
 *       : never;
 * }} ButtonEvents
 *
 * @typedef {Omit<Partial<HTMLButtonElement>, keyof ButtonEvents> & ButtonEvents} ButtonProps
 */

export const createButton = (/**@type ButtonProps */ props = {}, /**@type ElementOptions */ options = {}) => {
  const rv = document.createElement("button")
  Object.assign(rv, props)

  const { dataset } = options
  if (dataset) for (const key of Object.keys(dataset)) rv.dataset[key] = dataset[key]
  return rv
}

export const createCheckbox = (/**@type Partial<HTMLInputElement> */ props = {}) => {
  const rv = document.createElement("input")
  Object.assign(rv,    
    { type: "checkbox" },
    props,
  )
  return rv
}

export const createLabelForCheckbox = (
  /**@type HTMLInputElement */ cb,
  { text = "", /**@type Partial<HTMLLabelElement> */ props = {} } = {}
) => {
  const label = Object.assign(document.createElement("label"), props)
  label.append(cb, new Text(text))
  return label
}

export const importModule = async (/**@type string */ urlOrPath) => {
  const exports = await import(urlOrPath)
  return exports["default"] ?? exports
}

export const reimport = async (/**@type string */ urlOrPath, memberName = "default") => {
  const exports = (await import(`${resolve(urlOrPath)}?${String(Math.random()).slice(2)}`))
  if (memberName === "*") return exports
  if (memberName in exports) return exports[memberName]
  return exports
}

export const resolve = (/**@type string */ moduleID) => {
  if (moduleID.startsWith("@")) return import.meta.resolve(moduleID);
  tc.assert(moduleID[0] !== ".", "Argument moduleID must be an absolute URL or path");
  return import.meta.resolve(moduleID);
}

export const throwNewError = (/**@type string */ msg) => { throw new Error(msg) }

export const updateClass = async (/**@type Function */ Ctor, basePath = "@me/js") => {
  // @ts-ignore
  let url = Ctor.importMetaURL ?? basePath + "/" + Ctor.name + ".js";
  console.debug("url:", url)
  console.debug("resolved url:", url = import.meta.resolve(url))
  // if (url.startsWith("file://")) url = url.slice("file://".length)
  const imports = await import(`${url}?${String(Math.random()).slice(2)}`);
  const Ctor2 = (imports.default ?? imports[Ctor.name]);
  tc.assert(typeof Ctor2 === "function");
  tc.assert(Ctor2.name === Ctor.name);
  const proto2 = Ctor2.prototype;
  for (const key of Object.getOwnPropertyNames(proto2)) {
    if (key === "constructor") continue;
    Reflect.defineProperty(Ctor.prototype, key, Reflect.getOwnPropertyDescriptor(proto2, key));
  }
  // Update static members.
  for (const [name, desc] of Object.entries(Object.getOwnPropertyDescriptors(Ctor2))) {
    if (typeof desc.value === "function") {
      if (String(desc.value) !== String(Ctor[name])) {
        if (!desc.writable && !desc.configurable) {
          console.warn("[updateClass] Cannot update static method %s.%s", Ctor.name, name);
          continue;
        }
        console.log("[updateClass] Updating static method %s.%s", Ctor.name, name);
        Object.defineProperty(Ctor, name, desc);
      }
      continue;
    }
    if ("value" in desc && typeof desc.value !== "function") {
      if (["length", "name", "prototype"].includes(name)) continue;
      if (desc.writable === false) {
        console.warn("[updateClass] Cannot update non-writable property %s", name);
        continue;
      }
      Ctor2[name] = Ctor[name];
      continue;
    }
  }
};