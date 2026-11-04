/**@typedef {string} isostring - ISO 8601 string, possibly truncated to month or day precision. */
/**@typedef {(0 | 1 | 2)} completionStatus - ISO 8601 string, possibly truncated to month or day precision. */

import Region from "@me/Region.js";
import { throwNewError } from "@me/utils.js";

function parseDateColumn (/**@type unknown */ arg) {
    switch (typeof arg) {
        case "object": return arg.getFullYear()
        case "string": return arg
        default: return arg
    }
}

const CompletionStatus = Object.freeze({
    NONE: 0,
    OWNED: 1,
    COMPLETED: 2,
    PERFECTED: 3,
})

const Console = Object.freeze({
    ARCADE: { en: "Arcade" },
    DEDICATED: { en: "Console dédiée" },
    colorTvGame: { jp: "Color TV-Game" },
    "3ds": { jp: "3DS" },
    "3dsES": { jp: "3DS eShop" },
    "3dsVC": { jp: "3DS Virtual Console" },
    ds: { en: "DS" },
    dsDownloadPlay: { jp: "DS Download Play" },
    dsIWare: { jp: "DSiWare" },
    eReader: { jp: "e-Reader" },
    famicomSwitchOnline: { jp: "Famicom Switch Online" },
    fds: { jp: "Famicom Disk System" },
    gw: { jp: "Game & Watch" },
    gb: { en: "Game Boy" },
    gba: { en: "Game Boy Advance" },
    gbc: { en: "Game Boy Color" },
    gbSwitchOnline: { jp: "GB Switch Online" },
    gbaSwitchOnline: { jp: "GBA Switch Online" },
    gbcSwitchOnline: { jp: "GBC Switch Online" },
    gc: { en: "GameCube" },
    gcSwitchOnline: { en: "GC Switch Online" },
    nes: { en: "Nintendo Entertainment System", jp: "Famicom" },
    n64: { en: "Nintendo 64" },
    n64dd: { jp: "Nintendo 64DD" },
    n64SwitchOnline: { jp: "N64 Switch Online" },
    pc1O: { en: "PlayChoice-10" },
    pgb: { jp: "Nintendo Power GB" },
    pgbc: { jp: "Nintendo Power GBC" },
    pokémonMini: { jp: "Pokémon Mini" },
    psf: { jp: "Nintendo Power SF" },
    ps1: { en: "PlayStation" },
    ps2: { en: "PlayStation 2" },
    ps3: { en: "PlayStation 3" },
    ps4: { en: "PlayStation 4" },
    ps5: { en: "PlayStation 5" },
    ps6: { en: "PlayStation 6" },
    sfSwitchOnline: { jp: "SF Switch Online" },
    snes: { en: "Super Nintendo", jp: "Super Famicom" },
    switch: { en: "Switch" },
    switchES: { en: "Switch eShop" },
    switch2: { en: "Switch 2" },
    switch2ES: { en: "Switch 2 eShop" },
    sv: { jp: "Satellaview" },
    vb: { jp: "Virtual Boy" },
    vbSwitchOnline: { en: "VB Switch Online" },
    vss: { jp: "VS. System" },
    wii: { all: "Wii" },
    wiiUES: { all: "Wii U eShop" },
    wiiVC: { all: "Wii Virtual Console" },
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
    static propertyKeys = ["region", "title", "console", "digital", "developers", "editors", "licencors", "releaseDate", "lineage", "type", "note"]

    completionStatus = CompletionStatus.NONE
    console = ""

    /**@type string[] */
    developers = []
    digital = false
    /**@type string[] */
    editors = []

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
    title = ""
    transcription = ""
    type = ""

    /**@type HTMLTableRowElement */
    row = document.createElement("tr")

    constructor (/**@type string */ title, /**@type string */ console, data = {}) {
        this.title = title || throwNewError("Missing arg: 'title'")
        this.console = console || throwNewError("Missing arg: 'console'")
        Object.assign(this, data)
        Game.instances.push(this)
        Game.instancesByID.set(this.id, this)
        Game.instancesByTitle.get(title)?.push(this) ?? Game.instancesByTitle.set(title, [this])
    }

    // TODO: use a schema to know whether to render property values as text or HTML.
    updateRow () {
      const { row } = this
      if (row.cells.length) row.textContent = ""
      for (const key of Game.propertyKeys) {
        const td = row.insertCell()
        const value = this[key]
        if (key === "title" && value.startsWith("<ruby")) {
            td.innerHTML = value
        } else {
            td.textContent = Array.isArray(value) ? value.join(", ") : value
        }
        if (key === "title" && this.transcription) td.title = this.transcription
      }
    }

    static getByID (/**@type string */ id) {
        return Game.instancesByID.get(id)
    }
    static getByTitle (/**@type string */ title) {
        return Game.instancesByTitle.get(title)
    }

    static async loadFile (/**@type File */ file) {
        console.debug("Loading file:", file)
        const t0 = Date.now()
        /**@type { { sheet: string; data: unknown[][] }[] } */
        const sheets = await readXlsxFile(file)
        for (const { sheet: name, data: rows } of sheets) {
            if (!name.startsWith("Nintendo of ")) {
                console.warn("Unrecognizable sheet name:", name);
                continue
            }
            const longRegionName = name.slice("Nintendo of ".length)
            const region = Region.byName(longRegionName)
            const rowIterator = rows.values()
            // Skips the first row.
            const columnNames = rowIterator.next().value ?? []
            if (!columnNames.length) continue;
            const hasRawDateColumn = columnNames.includes("Raw Date")
            // TODO: make this configurable via a schema.
            for (const [title, consoleID, _releaseDate, developers, note, rawDate] of rowIterator) {
                try {
                    new Game(String(title), consoleID, {
                        developers: developers?.split(", ") ?? [],
                        note: note ?? "",
                        region,
                        releaseDate: (hasRawDateColumn && rawDate) ? Game.normalizeDateString(rawDate) : parseDateColumn(_releaseDate),
                    })
                } catch (err) {
                    console.error({ region, title, consoleID, _releaseDate, developers, note, rawDate })
                    console.error(err)
                }
            }
        }
        console.log(`Done loading file "${file.name}" in ${Date.now() - t0}ms`)
    }

    // In thie version, every regions has four dedicated columns:
    // for title, physical release date, digital release date and editor(s).
    static async loadFileV2 (/**@type File */ file) {
        console.debug("Loading file:", file)
        const t0 = Date.now()
        /**@type { { sheet: string; data: unknown[][] }[] } */
        const sheets = await readXlsxFile(file)
        for (const { sheet: name, data: rows } of sheets) {
            console.log("Loading sheet \"%s\" (%d rows)", name, rows.length);
            const rowIterator = rows.values()
            // Skips the first row.
            const columnNames = rowIterator.next().value ?? []
            if (!columnNames.length) continue;
            // ["Titre JP", "Titre NA", "Titre EU", "Date JP Phys", "Date NA Phys", "Date EU Phys", "Date JP Dig", "Date NA Dig", "Date EU Dig", "Console", "Type", "Développeur", "Editeur jp", "Editeur NA", "Editeur EU", "Licensors", "Série", "Note"]
            // TODO: make this configurable via a schema.
            for (const [
                titleJP, transcription, titleNA, titleEU,
                physicalReleaseDateJP, physicalReleaseDateNA, physicalReleaseDateEU,
                digitalReleaseDateJP, digitalReleaseDateNA, digitalReleaseDateEU,
                consoleID, type, developers,
                editorsJP, editorsNA, editorsEU,
                licensors, lineage, note,
            ] of rowIterator) {
                let title = "", digital = false, editors, digitalReleaseDate, physicalReleaseDate
                for (const region of ["jp", "na", "eu"]) {
                    switch (region) {
                        case "eu": {
                            title = titleEU; editors = editorsEU; digitalReleaseDate = digitalReleaseDateEU; physicalReleaseDate = physicalReleaseDateEU;
                            break
                        }
                        case "jp": {
                            title = titleJP; editors = editorsJP; digitalReleaseDate = digitalReleaseDateJP; physicalReleaseDate = physicalReleaseDateJP;
                            break
                        }
                        case "na": {
                            title = titleNA; editors = editorsNA; digitalReleaseDate = digitalReleaseDateNA; physicalReleaseDate = physicalReleaseDateNA;
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
                            editors: editors?.split(", ") ?? [],
                            licensors: licensors?.split(", ") ?? [],
                            lineage: lineage ?? "",
                            note: note ?? "",
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
                        console.error(gameCtorOptions)
                        console.error(err)
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
    }

    static updateColumns (/**@type string[] */ propertyKeys) {
        const game = Game.instances[0]
        if (game) for (const key of propertyKeys) if (!(key in game)) throwNewError(`Unknown game property: "${key}"`)
        Game.propertyKeys = propertyKeys
        for (const game of Game.instances) game.updateRow()
    }

    static *yieldPropertyValues (/**@type string */ propertyKey) {
        for (const game of Game.instances) yield game[propertyKey]
    }
}
