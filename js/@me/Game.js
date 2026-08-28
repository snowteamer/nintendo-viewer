/**
C'est possible en stockant les dates au format `[année]-[mois]-[jour]` pour ça, ça permet de les garder triables par ordre chronologique même si le jour et/ou le mois sont absents

Mais ensuite pour que ces dates s'affichent sans inclure un faux 1er janvier ou 31 décembre alors qu'on en sait rien, je ne sais pas comment faire sur un tableur, 
Je sais seulement comment faire en langage du web...

> Mon rêve ce serait que par défaut, 100% des jeux tour statut confondu, toute console confondue se mettent ensemble pour former un seul grand tableau
ça va faire un grand tableau ça... une intégration Google Sheets risque de freeze le navigateur, à moins peut-être de découper ce grand tableau en pages pas trop grandes chacune

*/

/**@typedef {string} isostring - ISO 8601 string, possibly truncated to month or day precision. */
/**@typedef {(0 | 1 | 2)} completionStatus - ISO 8601 string, possibly truncated to month or day precision. */

const throwNewError = (/**@type string */ msg) => { throw new Error(msg) }

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

const Region = Object.freeze({
    au: "au", jp: "jp", kr: "kr", na: "na", pal: "pal"
})

/*
const monthMap = {
    jan: 1, fév: 2, mar: 3, avr: 4, mai: 5, juin: 6,
    juil: 7, août: 8, sep: 9, oct: 10, nov: 11, déc: 12
};
*/

const TBA = "TBA"

export default class Game {
    /**@type Game[] */
    static instances = []
    /**@type Map<string, Game> */
    static instancesByID = new Map()
    /**@type Map<string, Game[]> */
    static instancesByTitle = new Map()
    
    static monthMap = {
        jan: "01", fév: "02", mar: "03", avr: "04", mai: "05", juin: "06",
        juil: "07", aoû: "08", sep: "09", oct: "10", nov: "11", déc: "12"
    }
    static propertyKeys = ["region", "title", "console", "developers", "releaseDate"]
    static regionMap = {
        "America": Region.na,
        "Australia": Region.au,
        "Europe": Region.pal,
        "Japan": Region.jp,
        "Korea": Region.kr,
    }

    completionStatus = CompletionStatus.NONE
    console = ""

    /**@type string[] */
    developers = []

    get id () { return `${this.title}_${this.console}_${this.region}` }
    /**@type string[] */
    licensors = []

    note = ""
    refs = []
    region = ""
    releaseDate = ""
    title = ""

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

    updateRow () {
      const { row } = this
      if (row.cells.length) row.textContent = ""
      for (const key of Game.propertyKeys) {
        const td = row.insertCell()
        const value = this[key]
        td.textContent = Array.isArray(value) ? value.join(", ") : value
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
            const region = Game.regionMap[longRegionName] ?? throwNewError(`Unknown long region name: "${longRegionName}"`)
            const rowIterator = rows.values()
            // Skips the first row.
            rowIterator.next()
            for (const [title, consoleID, _releaseDate, developers, note, rawDate] of rowIterator) {
                try {
                    new Game(String(title), consoleID, {
                        developers: developers?.split(", ") ?? [],
                        note: note ?? "",
                        region,
                        releaseDate: Game.normalizeDateString(rawDate),
                    })
                } catch (err) {
                    console.error({ region, title, consoleID, _releaseDate, developers, note, rawDate })
                    console.error(err)
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

    static *query (props = {}) {
        const { completionStatus, console, developers, licensors, region, releaseDate, title, } = props
        const predicate = (/**@type Game */ game) => {
            
        }
        yield* Game.instances.filter(predicate)
    }

    static updateColumns (/**@type string[] */ propertyKeys) {
        const game = Game.instances[0]
        if (game) for (const key of propertyKeys) if (!(key in game)) throwNewError(`Unknown game property: "${key}"`)
        Game.propertyKeys = propertyKeys
        for (const game of Game.instances) game.updateRow()
    }
}
