import { createCheckbox, createLabelForCheckbox, throwNewError } from "@me/utils.js";
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
    useImage = false

    /**@type HTMLInputElement */
    checkbox
    emoji = ""
    /**@type HTMLLabelElement */
    label

    constructor (/**@type string */ name, /**@type string */ code, { useImage = false } = {}) {
        this.name = name
        this.code = code
        this.emoji = code.includes("-")
            ? code.split("-").map(codePart => Region.getCountryFlag(codePart)).join("\u00A0")
            : Region.getCountryFlag(code)
        this.useImage = useImage
        Region.instances.push(this)
        Region.instancesByCode[code] = this
        Region.instancesByName[name] = this
        // DOM elements.
        const region = this
        this.checkbox = createCheckbox({
            checked: true,
            onchange () {
                region.enabled = /**@type HTMLInputElement */ (this).checked
                UI.instance?.updatePredicate()
            }
        })
        this.label = createLabelForCheckbox(this.checkbox, {
            text: code.toUpperCase(),
            props: { title: name }
        })
    }

    static byCode (/**@type string */ code) {
        return Region.instancesByCode[code] ?? throwNewError(`Unknown region code: "${code}"`)
    }

    static byName (/**@type string */ name) {
        return Region.instancesByName[name] ?? throwNewError(`Unknown region name: "${name}"`)
    }

    // Source - https://stackoverflow.com/a/44070554
    // Posted by Markus
    // Retrieved 2026-10-02, License - CC BY-SA 3.0
    // Create flag from country code
    static getCountryFlag (/**@type string */ code) {
      // Mild sanity check.
      if (code.length !== 2) return code;
      // Convert char to Regional Indicator Symbol Letter
      function risl(/**@type string */ char) {
        return String.fromCodePoint(0x1F1E6 - 65 + char.toUpperCase().charCodeAt(0));
      }
      // Create RISL sequence from country code.
      return risl(code[0]) + risl(code[1]);
    }

    static load () {
        ;/**@type [string, string, { useImage: boolean }][] */ ([
            ["Australie", "au", { useImage: false }],
            ["Europe", "eu", { useImage: false }],
            ["Japon", "jp", { useImage: false }],
            ["Corée du Sud", "kr", { useImage: false }],
            ["USA et Canada", "us-ca", { useImage: true }],
        ]).forEach(args => new Region(...args))
    }

    createALink () {
        return Object.assign(document.createElement("a"), {
            href: `https://fr.wikipedia.org/wiki/${this.name}`,
            textContent: this.emoji || this.code
        })
    }
}

