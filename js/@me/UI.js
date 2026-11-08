import { tb, tBody, tHead } from "@me/dom.js"
import { createCheckbox, createLabelForCheckbox, throwNewError } from "@me/utils.js";
import Game from "@me/Game.js"
import ReferenceTooltip from "@me/ReferenceTooltip.js";
import Region from "@me/Region.js";

export default class UI {
  /**@type UI? */
  static instance = null

  /**@type { { name: string, propertyKey: keyof Game, sortOrder: string, th: HTMLTableCellElement? }[] } */
  columnDefinitions = [
    { name: "Région", propertyKey: "region", sortOrder: "", th: null },
    { name: "Titre", propertyKey: "title", sortOrder: "", th: null },
    { name: "Console", propertyKey: "console", sortOrder: "", th: null },
    { name: "Digital", propertyKey: "digital", sortOrder: "", th: null },
    { name: "Développeur(s)", propertyKey: "developers", sortOrder: "", th: null },
    { name: "Éditeur(s)", propertyKey: "editors", sortOrder: "", th: null },
    { name: "Licenseur(s)", propertyKey: "licensors", sortOrder: "", th: null },
    { name: "Date", propertyKey: "releaseDate", sortOrder: "", th: null },
    { name: "Série", propertyKey: "lineage", sortOrder: "", th: null },
    { name: "Type", propertyKey: "type", sortOrder: "", th: null },
    // { name: "Note", propertyKey: "note", sortOrder: "", th: null },
  ]

  /**@type string[] */
  consoleNames = []

  /**@type HTMLTableRowElement? */
  highlightedRow = null

  options = {
    ui: this,

    _alignCenter: false,
    get alignCenter () { return this._alignCenter },
    set alignCenter (bool) {
      this._alignCenter = bool
      tBody.style.textAlign = bool ? "center" : ""
    },

    _useCompactMode: false,
    get useCompactMode () { return this._useCompactMode },
    set useCompactMode (bool) {
      this._useCompactMode = bool
      if (bool) tb.classList.add("compact")
      else tb.classList.remove("compact")
    },

    _useCustomDateFormat: false,
    get useCustomDateFormat () { return this._useCustomDateFormat },
    set useCustomDateFormat (bool) {
      this._useCustomDateFormat = bool
      bool ? this.ui.useCustomDateFormat() : this.ui.useIsoDateFormat()
    },

    _useEmojiRegionFlags: false,
    get useEmojiRegionFlags () { return this._useEmojiRegionFlags },
    set useEmojiRegionFlags (bool) {
      this._useEmojiRegionFlags = bool
      bool ? this.ui.useEmojiRegionFlags() : this.ui.usePlainTextRegionFlags()
    },
  }

  predicate = (/**@type Game */ game) => (
    (Region.instancesByCode[game.region]?.enabled ?? false)
    && (this.selectedConsoleName === "" || game.console === this.selectedConsoleName)
  )

  rt = new ReferenceTooltip()

  selectedConsoleName = ""

  constructor () {
    if (UI.instance) throwNewError("An instance already exists.")
    const ui = UI.instance = this

    this.filePicker = Object.assign(document.createElement("input"), {
      id: "filePicker",
      type: "file",
      async onchange () {
        const file = ui.filePicker.files?.[0]
        if (!file) return
        Game.instances.length = 0
        await Game.loadFile(file)
        ui.updateColumns()
        ui.initRows()
        ui.updateConsoles()
      }
    })

    this.btnRegionALL = Object.assign(document.createElement("button"), {
      id: "btnRegionALL",
      onclick () {
        Region.instances.forEach(region => { region.checkbox.checked = true; region.enabled = true })
        ui.updatePredicate()
      },
      textContent: "Tout"
    })

    this.btnRegionNONE = Object.assign(document.createElement("button"), {
      id: "btnRegionNONE",
      onclick () {
        Region.instances.forEach(region => { region.checkbox.checked = false; region.enabled = false })
        ui.updatePredicate()
      },
      textContent: "Rien"
    })

    this.btnUnload = Object.assign(document.createElement("button"), {
      id: "btnUnload",
      onclick () { ui.unload() },
      textContent: "Vider",
      title: "Vider tout le tableau"
    })

    this.cbAlignCENTER = createCheckbox({
      onchange () { ui.options.alignCenter = /**@type HTMLInputElement */ (this).checked }
    })

    this.cbUseCompactMode = createCheckbox({
      onchange () { ui.options.useCompactMode = /**@type HTMLInputElement */ (this).checked }
    })

    this.cbUseEmojiFlags = createCheckbox({
      onchange () { ui.options.useEmojiRegionFlags = /**@type HTMLInputElement */ (this).checked }
    })

    this.lblAlignCenter = createLabelForCheckbox(this.cbAlignCENTER, {
      text: "Centrer",
      props: {
        title: "Centrer les colonnes"
      }
    })

    this.lblUseCompactMode = createLabelForCheckbox(this.cbUseCompactMode, {
      text: "Mode compact",
    })

    this.lblUseEmojiFlags = createLabelForCheckbox(this.cbUseEmojiFlags, {
      text: "Drapeaux",
      props: {
        title: "Utiliser des drapeaux pour les régions"
      }
    })

    this.seConsole = document.createElement("select")
    this.seConsole.add(Object.assign(new Option("Toutes consoles", "", true)))
    this.seConsole.onchange = function () {
      ui.selectedConsoleName = ui.seConsole.value
      ui.updatePredicate()
      // TODO: use colgroups instead.
      if (ui.selectedConsoleName) tb.classList.add("hide-col-3")
      else tb.classList.remove("hide-col-3")
    }

    this.spCounter = Object.assign(document.createElement("span"), {
      id: "counter",
      textContent: `0 / 0`
    })
  
    tb.onclick = (event) => {
      const { originalTarget } = event
      let tr
      switch (originalTarget.tagName.toLowerCase()) {
        case "td": tr = originalTarget.parentNode; break
        case "th": return
        case "tr": tr = originalTarget; break
        default: return
      }
      if (tr === ui.highlightedRow) return;
      ui.highlightedRow?.classList.remove("highlighted");
      ui.highlightedRow = tr
      ui.highlightedRow?.classList.add("highlighted");
    }
  }

  blink (/**@type Function */ callback, dt = 1000) {
    return setInterval(callback, dt);
  }

  createTooltipReference (/**@type string */ text) {
    const sup = document.createElement("sup")
    sup.textContent = text
    sup.className = "citation-link"
    sup.onmouseenter = () => { this.rt.hide(); this.rt.show(sup.getBoundingClientRect()) }
    sup.onmouseleave = () => this.rt.hide()
    return sup
  }

  initRows () {
    tBody.textContent = ""
    for (const game of Game.instances) tBody.appendChild(game.row)
    this.updateCounter(Game.instances.length)
  }

  reset () {
    for (const region of Region.instances) region.checkbox.checked = true
    this.seConsole.selectedIndex = 0
    for (const game of Game.instances) game.row.style.display = ""
    this.updateCounter(Game.instances.length)
  }

  sortGames (/**@type NonNullable<Parameters<Array<Game>["sort"]>[0]> */ comparator) {
    Game.instances.sort(comparator)
    tBody.textContent = ""
    for (const game of Game.instances) tBody.appendChild(game.row)
  }

  sortGamesByProperty (/**@type keyof Game */ propertyKey, reverseOrder = false) {
    this.sortGames(
      reverseOrder
      ? (a, b) => -String(a[propertyKey]).localeCompare(String(b[propertyKey]))
      : (a, b) => String(a[propertyKey]).localeCompare(String(b[propertyKey]))
    )
  }

  toggleColumnByIndex (/**@type number */ index) {
    tb.classList.toggle(`hide-col-${index + 1}`)
  }

  toggleColumnByName (/**@type string */ name) {
    const columnNames = this.columnDefinitions.map(c => c.name)
    const index = columnNames.indexOf(name)
    if (index < 0) return
    tb.classList.toggle(`hide-col-${index + 1}`)
  }

  unload () {
    Game.unload()
    tBody.textContent = ""
    this.updateConsoles()
    this.updateCounter(0)
    this.filePicker.value = ""
  }

  updateColumns () {
    const gamePropertyKeys = this.columnDefinitions.map(c => c.propertyKey)
    try { Game.updateColumns(gamePropertyKeys) } catch (err) { console.error(err.message) }
    const tr = tHead.querySelector("tr") ?? tHead.insertRow()
    tr.textContent = ""
    for (const column of this.columnDefinitions) {
      const th = document.createElement("th")
      th.textContent = column.name
      tr.appendChild(th)
      column.th = th
      // Makes the column sortable by clicking on its header.
      th.onclick = () => {
        const { propertyKey, sortOrder } = column
        if (sortOrder === "A") {
          this.sortGamesByProperty(propertyKey, true)
          column.sortOrder = "D"
        } else {
          this.sortGamesByProperty(propertyKey);
          column.sortOrder = "A"
        }
      }
    }
  }

  updateConsoles () {
    this.consoleNames.length = 0
    this.consoleNames.push(...new Set(Game.instances.map(g => g.console).sort()))
    // View
    this.seConsole.options.length = 1 // Keeps only the "Toutes" option.
    for (const consoleName of this.consoleNames) {
      this.seConsole.appendChild(
        Object.assign(document.createElement("option"), { text: consoleName, value: consoleName })
      )
    }
  }

  updateCounter (/**@type number */ numVisibleRows) {
    this.spCounter.textContent = `${numVisibleRows} / ${Game.instances.length}`
  }

  updatePredicate () {
    let numVisibleRows = 0
    for (const game of Game.instances) {
      if (this.predicate(game)) {
        numVisibleRows++
        game.row.style.display = ""
      } else {
        game.row.style.display = "none"
      }
    }
    this.updateCounter(numVisibleRows)
  }

  useCustomDateFormat () {
    const columnIndex = this.columnDefinitions.findIndex(c => c.propertyKey === "releaseDate")
    if (columnIndex < 0) return
    const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
    let datestring = ""
    for (const game of Game.instances) {
      const { releaseDate } = game
      if (releaseDate === "TBA") datestring = "TBA"
      else {
        const [year, month = "", day = ""] = String(releaseDate).split("-")
        if (year && month && day) datestring = `${day}/${month}/${year}`
        else if (year && month) datestring = `${months[Number(month) - 1]}-${year}`
        else datestring = year
      }
      game.row.cells[columnIndex].textContent = datestring
    }
  }

  useEmojiRegionFlags () {
    const columnIndex = this.columnDefinitions.findIndex(c => c.propertyKey === "region")
    if (columnIndex < 0) return
    tBody.classList.add("use-emoji-flags")
    for (const game of Game.instances) {
      const { region: code } = game
      const region = Region.byCode(code)
      game.row.cells[columnIndex].textContent = region.emoji || region.code
    }
    for (const region of Region.instances) {
      if (region.checkbox.nextSibling instanceof Text) {
        region.checkbox.nextSibling.data = (region.emoji || region.code.toLocaleUpperCase())
      }
    }
  }

  useIsoDateFormat () {
    const columnIndex = this.columnDefinitions.findIndex(c => c.propertyKey === "releaseDate")
    if (columnIndex < 0) return
    for (const game of Game.instances) {
      game.row.cells[columnIndex].textContent = game.releaseDate
    }
  }

  usePlainTextRegionFlags () {
    const columnIndex = this.columnDefinitions.findIndex(c => c.propertyKey === "region")
    if (columnIndex < 0) return
    tBody.classList.remove("use-emoji-flags")
    for (const game of Game.instances) {
      game.row.cells[columnIndex].textContent = game.region
    }
    for (const region of Region.instances) {
      if (region.checkbox.nextSibling instanceof Text) {
        region.checkbox.nextSibling.data = region.code.toLocaleUpperCase()
      }
    }
  }
}
