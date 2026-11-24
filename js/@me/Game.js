
import Region from "@me/Region.js";
import { throwNewError } from "@me/utils.js";
import UI from "@me/UI.js";
import Console from "@me/Console.js";

function parseDateColumn (/**@type unknown */ arg) {
    switch (typeof arg) {
        case "object": {
            if (arg === null) return ""
            if (arg instanceof Date) {
                console.warn("Imprecise Date found - limiting precision to year only.")
                return String(arg.getFullYear())
            }
            return ""
        }
        case "string": return arg
        default: return String(arg)
    }
}

const CompletionStatus = Object.freeze({
    NONE: 0,
    OWNED: 1,
    COMPLETED: 2,
    PERFECTED: 3,
})

const GameType = Object.freeze({
    CLONE: "Clone",
    CONVERSION: "Conversion",
    ORIGINAL_GAME: "Jeu original",
    REMASTER: "Remaster",
})

/*
const monthMap = {
    jan: 1, fév: 2, mar: 3, avr: 4, mai: 5, juin: 6,
    juil: 7, août: 8, sep: 9, oct: 10, nov: 11, déc: 12
};
*/

const inputSchema = {
    "console": { type: String, oneOf: Object.values(Console) },
    "developers": { type: [String] },
    "digital": { type: Boolean },
    "editors": { type: [String] },
    "licensors": { type: [String] },
    "lineage": { type: String },
    "note": { type: String },
    "region": { type: Region },
    "releaseDate": { type: Date },
    "title": { type: String },
    "type": { type: String, oneOf: Object.values(GameType) },
    "transcription": { type: String }
}

const INCONNU = "Inconnu"
const TBA = "TBA"

export default class Game {
    /**@type RawGameEntry[] */
    static rawEntries = []

    /**@type Game[] */
    static instances = []
    /**@type Map<string, Game> */
    static instancesByID = new Map()
    /**@type Map<string, Game[]> */
    static instancesByTitle = new Map()

    /**@type Record<string, string> */
    static monthMap = {
        jan: "01", fév: "02", mar: "03", avr: "04", mai: "05", juin: "06",
        juil: "07", aoû: "08", sep: "09", oct: "10", nov: "11", déc: "12"
    }
    /**@type GamePropertyKey[] */
    static propertyKeys = ["region", "fullTitle", "console", "digital", "developers", "editors", "licensors", "releaseDate", "lineage", "type", "note"]
    // Used in 'Game.unrubyTitle()'.
    static td = document.createElement("td")

    completionStatus = CompletionStatus.NONE
    console = ""

    /**@type string[] */
    developers = []
    digital = false
    /**@type string[] */
    editors = []
    // May include HTML <ruby> annotations.
    // TODO: store this another way, without HTML.
    fullTitle = ""

    get id () { return `${this.title}_${this.console}_${this.region}` }
    /**@type string[] */
    licensors = []
    // Aka. Série
    lineage = ""

    note = ""
    /**@type string[] */
    refs = []
    region = ""
    releaseDate = ""
    // Title without ruby annotations.
    title = ""
    transcription = ""
    type = ""

    /**@type HTMLTableRowElement */
    row = document.createElement("tr")

    constructor (/**@type string */ fullTitle, /**@type string */ console, data = {}) {
        this.fullTitle = fullTitle || throwNewError("Missing arg: 'fullTitle'")
        this.console = console || throwNewError("Missing arg: 'console'")
        this.title = Game.unrubyTitle(fullTitle)
        Object.assign(this, data)
        Game.instances.push(this)
        Game.instancesByID.set(this.id, this)
        Game.instancesByTitle.get(this.title)?.push(this) ?? Game.instancesByTitle.set(this.title, [this])
    }

    // TODO: use a schema to know whether to render property values as text or HTML.
    updateRow () {
      const { row, transcription } = this
      if (row.cells.length) row.textContent = ""
      for (const key of Game.propertyKeys) {
        const td = row.insertCell()
        let value = this[key]
        if (key === "region") {
            if (UI.instance?.options.useRegionalFlags) value = Region.byCode(this.region).emoji
        }
        if (key === "fullTitle" && String(value).includes("<ruby")) {
            td.innerHTML = String(value)
        } else {
            td.textContent = Array.isArray(value) ? value.join(", ") : String(value)
        }
        if ((key === "fullTitle" || key === "title") && transcription) td.title = transcription
      }
    }

    static getByID (/**@type string */ id) {
        return Game.instancesByID.get(id)
    }
    static getByTitle (/**@type string */ title) {
        return Game.instancesByTitle.get(title)
    }

    static groupBy (/**@type GamePropertyKey[] */ ...propertyKeys) {
        /**@type Map<string, Game[]> */
        const map = new Map()
        for (const game of Game.instances) {
            const nUplet = propertyKeys.map((/**@type GamePropertyKey */ propertyKey) => game[propertyKey]).join("_")
            map.get(nUplet)?.push(game) ?? map.set(nUplet, [game])
        }
        return map
    }

    // In thie version, every regions has four dedicated columns:
    // for title, physical release date, digital release date and editor(s).
    // One row for every distinct title/console/region combination.
    static async loadFile (/**@type File */ file) {
        console.debug("Loading file:", file)
        const t0 = Date.now()
        /**@type { { sheet: string; data: any[][] }[] } */
        const sheets = await readXlsxFile(file)
        for (const { sheet: name, data: rows } of sheets) {
            console.log("Loading sheet \"%s\" (%d rows)", name, rows.length);
            const rowIterator = rows.values()
            // Skips the first row.
            const columnNames = rowIterator.next().value ?? []
            if (!columnNames.length) continue;
            // TODO: make this configurable via a schema.
            for (const dataRow of rowIterator) {
                const [
                    titleJP, transcription, titleUSCA, titleEU, titleAU,
                    physicalReleaseDateJP, physicalReleaseDateUSCA, physicalReleaseDateEU, physicalReleaseDateAU,
                    digitalReleaseDateJP, digitalReleaseDateUSCA, digitalReleaseDateEU, digitalReleaseDateAU,
                    consoleID, type, developers,
                    editorsJP, editorsUSCA, editorsEU, editorsAU,
                    licensors, lineage, note,
                ] = dataRow
                Game.rawEntries.push({
                    titleJP, transcription, titleUSCA, titleEU, titleAU,
                    physicalReleaseDateJP, physicalReleaseDateUSCA, physicalReleaseDateEU, physicalReleaseDateAU,
                    digitalReleaseDateJP, digitalReleaseDateUSCA, digitalReleaseDateEU, digitalReleaseDateAU,
                    consoleID, type, developers,
                    editorsJP, editorsUSCA, editorsEU, editorsAU,
                    licensors, lineage, note,
                })
                let title = "", digital = false, editors, digitalReleaseDate, physicalReleaseDate
                for (const region of ["eu", "jp", "us-ca", "au"]) {
                    switch (region) {
                        case "eu": {
                            title = titleEU; editors = editorsEU; digitalReleaseDate = digitalReleaseDateEU; physicalReleaseDate = physicalReleaseDateEU;
                            break
                        }
                        case "jp": {
                            title = titleJP; editors = editorsJP; digitalReleaseDate = digitalReleaseDateJP; physicalReleaseDate = physicalReleaseDateJP;
                            break
                        }
                        case "us-ca": {
                            title = titleUSCA; editors = editorsUSCA; digitalReleaseDate = digitalReleaseDateUSCA; physicalReleaseDate = physicalReleaseDateUSCA;
                            break
                        }
                        case "au": {
                            title = titleAU; editors = editorsAU; digitalReleaseDate = digitalReleaseDateAU; physicalReleaseDate = physicalReleaseDateAU;
                            break
                        }
                    }
                    if (title) {
                        if (!editors) console.warn("Missing editors for game:", title);
                        if (!physicalReleaseDate && !digitalReleaseDate) console.warn("Missing physical or digital release date for game:", title);
                    }
                    try {
                        const gameCtorOptions = {
                            developers: developers?.split(", ") ?? [],
                            digital: false,
                            editors: editors?.split(", ") ?? [],
                            licensors: licensors?.split(", ") ?? [],
                            lineage: lineage ?? "",
                            note: note ?? "",
                            releaseDate: "",
                            region,
                            transcription,
                            type,
                        }
                        if (physicalReleaseDate) {
                            gameCtorOptions.digital = false
                            gameCtorOptions.releaseDate = parseDateColumn(physicalReleaseDate)
                            new Game(String(title), consoleID, gameCtorOptions)
                        }
                        if (digitalReleaseDate) {
                            gameCtorOptions.digital = true
                            gameCtorOptions.releaseDate = parseDateColumn(digitalReleaseDate)
                            new Game(String(title), consoleID, gameCtorOptions)
                        }
                    } catch (err) {
                        console.error(err, "Data row:", dataRow)
                    }
                }
            }
        }
        console.log(`Done loading file "${file.name}" in ${Date.now() - t0}ms`)
    }

    // Returns an ISO string, possibly truncated according to precision.
    static normalizeDateString (/**@type string */ text) {
        if (!text) throwNewError("Missing text");
        if (text === TBA) return TBA
        text = String(text)
        if (text.includes("-")) {
            const parts = text.split('-');
            if (parts.length !== 2) throwNewError(`Invalid date: "${text}"`)

            const [monthAbbreviation, year] = parts    
            const month = Game.monthMap[
                // Use only the first three characters of the month abbreviation,
                // or four if it starts with "jui" like "juin or "juil.".
                monthAbbreviation.toLowerCase().slice(0, /^jui/i.test(monthAbbreviation) ? 4 : 3)
            ] ?? throwNewError(`Unknown month string: "${monthAbbreviation}"`);
            return `${year}-${month}`
        }
        else if (text.includes("/")) {
            const [day, month, year] = text.split("/")
            return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
        }
        else {
            if (text.length !== 4 || !(text[0] === "1" || text[0] === "2")) throwNewError(`Invalid date: "${text}"`)
            return text
        }
    }

    // Unload all instances.
    static unload () {
        for (const { row } of this.instances) row.textContent = ""
        this.instances.length = 0
        this.instancesByID.clear()
        this.instancesByTitle.clear()
        this.rawEntries.length = 0
    }

    // TODO: avoid the HTML injection.
    static unrubyTitle (/**@type string */ fullTitle) {
        if (!fullTitle.includes("<ruby")) return fullTitle
        Game.td.innerHTML = fullTitle
        // For safety.
        if (Game.td.querySelector("script")) throwNewError("Found forbidden tag in provided 'fullTitle'!")
        const parts = []
        for (const node of Game.td.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                parts[parts.length] = /**@type Text */ (node).data
            } else if (node instanceof Element && node.tagName.toLowerCase() === "ruby") {
                for (const innerNode of node.childNodes) {
                    if (innerNode.nodeType === Node.TEXT_NODE) {
                        parts[parts.length] = /**@type Text */ (innerNode).data
                    }
                }
            }
        }
        return parts.join("").trimEnd()
    }

    static updateColumns (/**@type GamePropertyKey[] */ propertyKeys) {
        Game.validatePropertyKeys(propertyKeys)
        Game.propertyKeys = propertyKeys
        Game.updateAllRows()
    }

    static updateAllRows () {
        for (const game of Game.instances) game.updateRow()
    }

    static validatePropertyKeys (/**@type GamePropertyKey[] */ propertyKeys) {
        const game = Game.instances[0]
        if (game) for (const key of propertyKeys) {
            if (!(key in game)) throwNewError(`Unknown game property: "${key}"`)
            if (typeof game[key] === "function") throwNewError(`Invalid game property: "${key}"`)
        }
    }

    static *yieldPropertyValues (/**@type GamePropertyKey */ propertyKey) {
        for (const game of Game.instances) yield game[propertyKey]
    }
}
