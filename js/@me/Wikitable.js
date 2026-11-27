import Game from "@me/Game.js";
import { setPrefixSuper } from "@me/UI.js";

export default class Wikitable {
    static instancesByCaptionText = new Map()

    captionText = ""
    predicate = (/**@type RawGameEntry */ game) => false
    regions = ["AU", "EU", "JP", "US-CA"]

    table = document.createElement("table")
    tBody = this.table.createTBody()
    tHead = this.table.createTHead()

    colgroup = document.createElement("colgroup")
    hr = document.createElement("hr")

    thTitle
    thDevelopers
    tdReleaseDates
    thReferences

    thsByRegion = new Map()

    constructor (/**@type string */ captionText, /**@type (game: RawGameEntry) => boolean */ predicate) {
        Wikitable.instancesByCaptionText.set(captionText, this)
        this.captionText = captionText
        this.predicate = predicate
        const { regions, table, tHead } = this
        table.className = "wikitable2"
        const h0 = tHead.insertRow()
        const h1 = tHead.insertRow()
        let th

        th = h0.appendChild(document.createElement("th"))
        th.rowSpan = 2
        th.textContent = "Titre"
        this.thTitle = th

        th = h0.appendChild(document.createElement("th"))
        th.rowSpan = 2
        th.textContent = "Développeur(s)"
        this.thDevelopers = th

        th = h0.appendChild(document.createElement("th"))
        th.colSpan = regions.length
        th.textContent = "Dates de sortie"
        this.tdReleaseDates = th

        th = h0.appendChild(document.createElement("th"))
        th.rowSpan = 2
        th.textContent = "Réf."
        this.thReferences = th
        /* Second header row */
        for (const region of regions) {
            const th = h1.appendChild(document.createElement("th"))
            th.textContent = region
            this.thsByRegion.set(region, th)
        }
    }

    update () {
        const { captionText, predicate } = this
        this.table.createCaption().textContent = this.captionText
        this.tBody.replaceChildren()
        for (const rawGameEntry of Game.rawEntries) {
            if (!predicate(rawGameEntry)) continue
            /**@ts-ignore */
            const {
                titleJP, transcription, titleUSCA, titleEU, titleAU,
                physicalReleaseDateJP, physicalReleaseDateUSCA, physicalReleaseDateEU, physicalReleaseDateAU,
                digitalReleaseDateJP, digitalReleaseDateUSCA, digitalReleaseDateEU, digitalReleaseDateAU,
                consoleID, type, developers,
                editorsJP, editorsUSCA, editorsEU, editorsAU,
                licensors, lineage, note,
            } = rawGameEntry
            const row = this.tBody.insertRow()
            const titlesByRegionCode = { au: titleAU, eu: titleEU, jp: titleJP, "us-ca": titleUSCA }
            const releaseDatesByRegionCode = {
                au: physicalReleaseDateAU ?? digitalReleaseDateAU,
                eu: physicalReleaseDateEU ?? digitalReleaseDateEU,
                jp: physicalReleaseDateJP ?? digitalReleaseDateJP,
                "us-ca": physicalReleaseDateUSCA ?? digitalReleaseDateUSCA,
            }
            let td = row.insertCell()
            /**@type Record<string, string[]> */
            const regionCodesByTitle = {}
            /**@type Record<string, HTMLElement> */
            const parasByTitle = {}
            for (const [code, title] of Object.entries(titlesByRegionCode)) {
                if (title && !parasByTitle[title]) {
                    const para = parasByTitle[title] = document.createElement("p")
                    if (title.includes("<ruby")) para.innerHTML = title;
                    else para.textContent = title
                    regionCodesByTitle[title] ??= []
                    regionCodesByTitle[title].push(code)
                }
            }
            for (const [title, para] of Object.entries(parasByTitle)) {
                td.appendChild(para)
                setPrefixSuper(para, ...regionCodesByTitle[title])
            }
            /* Developer(s) */
            td = row.insertCell()
            td.textContent = Array.isArray(developers) ? developers.join(", ") : developers
            for (const releaseDate of Object.values(releaseDatesByRegionCode)) {
                td = row.insertCell()
                td.textContent = releaseDate
            }
        }
    }
}