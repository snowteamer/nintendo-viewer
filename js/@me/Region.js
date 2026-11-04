import { throwNewError } from "@me/utils.js";

export default class Region {
    /**@type Region[] */
    static instances = []
    /**@type Record<string, Region> */
    static instancesByCode = Object.create(null)
    /**@type Record<string, Region> */
    static instancesByName = Object.create(null)

    code = ""
    enabled = true
    name = ""
    /**@type Region? */
    parent = null

    /**@type HTMLInputElement? */
    checkbox = null
    emoji = ""
    /**@type HTMLLabelElement? */
    label = null

    constructor (/**@type string */ name, /**@type string */ code, { hasEmoji = false }) {
        this.name = name
        this.code = code
        if (hasEmoji) this.emoji = this.getCountryFlag(code)
        Region.instances.push(this)
        Region.instancesByCode[code] = this
        Region.instancesByName[name] = this
    }

    static byName (/**@type string */ name) {
        return Region.instancesByName[name] ?? throwNewError(`Unknown region name: "${name}"`)
    }

    // Source - https://stackoverflow.com/a/44070554
    // Posted by Markus
    // Retrieved 2026-10-02, License - CC BY-SA 3.0
    // Create flag from country code
    getCountryFlag (/**@type string */ code) {
      // Mild sanity check.
      if (code.length !== 2) return code;
      // Convert char to Regional Indicator Symbol Letter
      function risl(/**@type string */ chr) {
        return String.fromCodePoint(0x1F1E6 - 65 + chr.toUpperCase().charCodeAt(0));
      }
      // Create RISL sequence from country code.
      return risl(code[0]) + risl(code[1]);
    }
}

;/**@type [string, string, { hasEmoji: boolean }][] */ ([
    ["Australia", "au", { useEmoji: true }],
    ["Europe", "eu", { hasEmoji: true }],
    ["Japan", "jp", { hasEmoji: true }],
    ["Korea", "kr", { hasEmoji: true }],
    ["America", "na", { hasEmoji: false }],
]).forEach(args => new Region(...args))

function createCheckboxForRegion (/**@type Region */ region) {
    return Object.assign(document.createElement("input"), {
        type: "checkbox",
        id: `cbRegion${region.code.toUpperCase()}`,
        checked: true,
        onchange (/**@type Event */ event) {
            // @ts-ignore
            region.enabled = event.target.checked
        }
    })
}

function createLabelForRegion (/**@type Region */ region) {
    return Object.assign(document.createElement("label"), {
        id: `lblRegion${region.code.toUpperCase()}`,
    })
}

for (const region of Region.instances) {
    region.checkbox = createCheckboxForRegion(region)
    region.label = createLabelForRegion(region)
    region.label.append(region.checkbox, new Text(region.code.toUpperCase()))
}
