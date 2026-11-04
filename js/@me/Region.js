import { throwNewError } from "@me/utils.js";
import UI from "@me/UI.js";

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

    /**@type HTMLInputElement */
    checkbox
    emoji = ""
    /**@type HTMLLabelElement */
    label

    constructor (/**@type string */ name, /**@type string */ code, { hasEmoji = false }) {
        this.name = name
        this.code = code
        if (hasEmoji) this.emoji = this.getCountryFlag(code)
        Region.instances.push(this)
        Region.instancesByCode[code] = this
        Region.instancesByName[name] = this
        // Requires 'code' to be set.
        this.checkbox = this.createCheckbox()
        this.label = this.createLabel()
        this.label.append(this.checkbox, new Text(this.code.toUpperCase()))
    }

    static byCode (/**@type string */ code) {
        return Region.instancesByCode[code] ?? throwNewError(`Unknown region code: "${code}"`)
    }

    static byName (/**@type string */ name) {
        return Region.instancesByName[name] ?? throwNewError(`Unknown region name: "${name}"`)
    }

    static load () {
        ;/**@type [string, string, { hasEmoji: boolean }][] */ ([
            ["Australia", "au", { hasEmoji: true }],
            ["Europe", "eu", { hasEmoji: true }],
            ["Japan", "jp", { hasEmoji: true }],
            ["Korea", "kr", { hasEmoji: true }],
            ["America", "na", { hasEmoji: false }],
        ]).forEach(args => new Region(...args))
    }

    createCheckbox () {
        const region = this
        return Object.assign(document.createElement("input"), {
            type: "checkbox",
            id: `cbRegion${region.code.toUpperCase()}`,
            checked: true,
            onchange () {
                region.enabled = this.checked
                UI.instance?.updatePredicate()
            }
        })
    }

    createLabel () {
        const region = this
        return Object.assign(document.createElement("label"), {
            id: `lblRegion${region.code.toUpperCase()}`,
        })
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

