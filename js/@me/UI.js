import { colgroup, ribbon, sectionList, tb, tBody, tHead } from "@me/dom.js"
import { createButton, createCheckbox, createLabelForCheckbox, throwNewError } from "@me/utils.js"
import Column from "@me/Column.js"
import Row from "@me/Row.js"
import Game from "@me/Game.js"
import ReferenceTooltip from "@me/ReferenceTooltip.js"
import Region from "@me/Region.js"
import { throwNewAssertionError } from "@me/tc.js"
import Wikitable from "@me/Wikitable.js";

function setPrefixImage (/**@type HTMLElement */ element, /**@type string */ cssImageValue) {
  if (cssImageValue === "") {
    element.classList.remove("has-prefix-image")
  } else {
    element.classList.add("has-prefix-image")
    element.style.setProperty("--prefix-image", cssImageValue)
  }
}

export function setPrefixImageSuper (/**@type HTMLElement */ element, /**@type string */ cssImageValue) {
  if (cssImageValue === "") {
    element.classList.remove("has-prefix-image-super")
  } else {
    element.classList.add("has-prefix-image-super")
    element.style.setProperty("--prefix-image", cssImageValue)
  }
}

export function setPrefixSuper (/**@type HTMLElement */ element, /**@type string[] */ ...prefixes) {
  if (prefixes.length) {
    element.classList.add("has-prefix-super")
    element.style.setProperty("--prefix", `"${prefixes.join("\u00A0")}"`)
  } else {
    element.classList.remove("has-prefix-super")
  }
}

function setSuffixSuper (/**@type HTMLElement */ element, /**@type string[] */ ...suffixes) {
  if (suffixes.length) {
    element.classList.add("has-suffix-super")
    element.style.setProperty("--suffix", `"${suffixes.join("\u00A0")}"`)
  } else {
    element.classList.remove("has-suffix-super")
  }
}

function unsetPrefix (/**@type HTMLElement */ element) {
  element.classList.remove("has-prefix");
}
function unsetPrefixSuper (/**@type HTMLElement */ element) {
  element.classList.remove("has-prefix-super");
}
function unsetSuffix (/**@type HTMLElement */ element) {
  element.classList.remove("has-suffix");
}
function unsetSuffixSuper (/**@type HTMLElement */ element) {
  element.classList.remove("has-suffix-super");
}

export default class UI {
  /**@type UI? */
  static instance = null

  /**@type Record<keyof UI["_options"], (this: UI, arg: boolean) => void> */
  static optionHandlers = {
    alignCenter (bool) {
      tBody.style.textAlign = bool ? "center" : ""
    },
    useCompactMode (bool) {
      if (bool) tb.classList.add("compact"); else tb.classList.remove("compact")
    },
    useCustomDateFormat (bool) {
      bool ? this.useCustomDateFormat() : this.useIsoDateFormat()
    },
    useRegionalFlags (bool) {
      bool ? this.useRegionalFlags() : this.usePlainTextRegionFlags()
    },
    useRegionalPrefixes (bool) {
      const ui = this
      const index = this.columns.findIndex(c => c.propertyKey === "fullTitle")
      if (bool) {
        ui.hideColumnByName("Région")
        for (const row of ui.rows) {
          setPrefixSuper(row.tr.cells[index], row.game.region)
        }
      } else {
        ui.showColumnByName("Région")
        for (const row of ui.rows) {
          unsetPrefixSuper(row.tr.cells[index])
        }
      }
    }
  }

  /**@type ColumnDefinition[] */
  columnDefinitions = [
    { name: "Région", propertyKey: "region" },
    { name: "Titre", propertyKey: "fullTitle" },
    { name: "Console", propertyKey: "console" },
    { name: "Digital", propertyKey: "digital" },
    { name: "Développeur(s)", propertyKey: "developers" },
    { name: "Éditeur(s)", propertyKey: "editors" },
    { name: "Licenseur(s)", propertyKey: "licensors" },
    { name: "Date", propertyKey: "releaseDate" },
    { name: "Série", propertyKey: "lineage" },
    { name: "Type", propertyKey: "type", },
    // { name: "Note", propertyKey: "note" },
  ]

  /**@type Column[] */
  columns = this.columnDefinitions.map(definition => new Column(definition))

  /**@type Map<string, Column> */
  columnsByName = new Map(this.columns.map(column => [column.name, column]))
  /**@type Map<string, Column> */
  columnsByPropertyKey = new Map(this.columns.map(column => [column.propertyKey, column]))

  /**@type string[] */
  consoleNames = []

  /**@type HTMLTableColElement? */
  highlightedCol = null
  /**@type HTMLTableRowElement? */
  highlightedRow = null

  /**@private */
  _options = {
    alignCenter: false,
    useCompactMode: false,
    useCustomDateFormat: false,
    useRegionalFlags: false,
    useRegionalPrefixes: false,
  }

  options = new Proxy(this._options, {
    get (_options, /**@type keyof UI["_options"] */ key) {
      return _options[key]
    },
    set: (_options, /**@type keyof UI["_options"] */ key, bool) => {
      if (_options[key] === bool) return false
      const ui = this
      UI.optionHandlers[key].call(ui, bool)
      _options[key] = bool
      ui.saveOptions()
      return true
    }
  })

  predicate = (/**@type Game */ game) => (
    (Region.instancesByCode[game.region]?.enabled ?? false)
    && (this.selectedConsoleName === "" || game.console === this.selectedConsoleName)
  )

  /**@type Row[] */
  rows = []
  /**@type Map<Game, Row> */
  rowsByGame = new Map()

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
        Game.unload()
        await Game.loadFile(file)
        ui.initRows()
        ui.updateColumns()
        ui.updateConsoles()
      }
    })

    this.btnDock = createButton({
      id: "btnDock",
      className: "btnDock",
      onclick () {
        const { docking: oldDocking } = this.dataset
        const newDocking = this.dataset.docking = oldDocking === "top" ? "bottom" : "top"
        ribbon.style.order = newDocking === "top" ? "0" : "2"
        this.textContent = newDocking === "top" ? "⍗" : "⍐" 
        this.title = `Ancrer en ${newDocking === "top" ? "bas": "haut"}`
      },
      textContent: "⍗",
      title: "Ancrer en bas"
    }, {
      dataset: {
        docking: "top"
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

    this.cbUseRegionalFlags = createCheckbox({
      onchange () { ui.options.useRegionalFlags = /**@type HTMLInputElement */ (this).checked }
    })

    this.cbUseRegionalPrefixes = createCheckbox({
      onchange () { ui.options.useRegionalPrefixes = /**@type HTMLInputElement */ (this).checked }
    })

    this.cbUseSpypiledMode = createCheckbox({
      onchange () {
        ;/**@type HTMLInputElement */ (this).checked ? ui.showSections() : ui.hideSections()
        //;/**@type HTMLInputElement */ (this).checked ? tb.style.display = "none" : tb.style.display = ""
      },
      textContent: "Une wikitable par console",
      title: "Afficher une wikitable par console distincte"
    })

    this.lblAlignCenter = createLabelForCheckbox(this.cbAlignCENTER, {
      text: "Centrer", props: { title: "Centrer les colonnes" }
    })

    this.lblUseCompactMode = createLabelForCheckbox(this.cbUseCompactMode, {
      text: "Mode compact",
    })

    this.lblUseSpypiledMode = createLabelForCheckbox(this.cbUseSpypiledMode, {
      text: "Mode spypilé", props: { title: "Afficher une wikitable par console distincte" }
    })

    this.lblUseRegionalFlags = createLabelForCheckbox(this.cbUseRegionalFlags, {
      text: "Drapeaux", props: { title: "Afficher des drapeaux pour les régions" }
    })

    this.lblUseRegionalPrefixes = createLabelForCheckbox(this.cbUseRegionalPrefixes, {
      text: "Préfixes régionaux", props: { title: "Afficher des préfixes pour les régions" }
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
      // @ts-ignore
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

  createSelectFromColumn (/**@type Column */ column) {
    const se = document.createElement("select")
    se.add(Object.assign(new Option("Toutes consoles", "", true)))
    const ui = this
    se.onchange = function () {
      column.selectedValue = se.value
      ui.updatePredicate()
      if (se.value === "") ui.hideColumnByName(column.name)
      else ui.showColumnByName(column.name)
    }
    return se
  }

  updateSelectFromColumn (/**@type Column */ column) {
    const { se } = column
    /**@type Set<string> */
    const valueSet = new Set(Game.instances.map(g => String(g[column.propertyKey])).sort())
    se.options.length = 1 // Keeps only the "Toutes" option.
    for (const value of valueSet) {
      se.appendChild(new Option(value, value))
    }
  }

  createTooltipReference (/**@type string */ text) {
    const sup = document.createElement("sup")
    sup.textContent = text
    sup.className = "citation-link"
    sup.onmouseenter = () => { this.rt.hide(); this.rt.show(sup.getBoundingClientRect()) }
    sup.onmouseleave = () => this.rt.hide()
    return sup
  }

  hideColumnByIndex (/**@type number */ index) {
    tb.classList.add(`hide-col-${index + 1}`)
  }

  hideColumnByName (/**@type string */ name) {
    const column = this.columnsByName.get(name) ?? throwNewAssertionError()
    const index = this.columns.indexOf(column)
    if (index > -1) tb.classList.add(`hide-col-${index + 1}`)
  }

  hideSections () {
    sectionList.style.display = "none"
  }

  initRows () {
    tBody.replaceChildren()
    for (const game of Game.instances) {
      const row = new Row(game)
      this.rows.push(row)
      this.rowsByGame.set(game, row)
      tBody.appendChild(row.tr)
    }
    this.updateCounter(Game.instances.length)
  }

  reset () {
    for (const region of Region.instances) region.checkbox.checked = true
    this.seConsole.selectedIndex = 0
    for (const row of this.rows) row.hide()
    this.updateCounter(Game.instances.length)
  }

  saveOptions () {
    try {
      localStorage.setItem("SpyDB_options", JSON.stringify(this._options))
    } catch (err) {
      console.warn(err)
    }
  }

  showColumnByIndex (/**@type number */ index) {
    tb.classList.remove(`hide-col-${index + 1}`)
  }

  showColumnByName (/**@type string */ name) {
    const column = this.columnsByName.get(name) ?? throwNewAssertionError()
    const index = this.columns.indexOf(column)
    if (index > -1) tb.classList.remove(`hide-col-${index + 1}`)
  }

  showSections () {
    for (const consoleName of this.consoleNames) {
      const wt = new Wikitable(consoleName, (/**@type RawGameEntry */ rge) => rge.consoleID === consoleName)
      sectionList.appendChild(wt.table)
      wt.update()
    }
    sectionList.style.display = "initial"
  }

  sortGames (/**@type NonNullable<Parameters<Array<Game>["sort"]>[0]> */ comparator) {
    const { rows } = this
    tBody.replaceChildren()
    rows.sort((row, otherRow) => comparator(row.game, otherRow.game))
    for (const row of rows) tBody.appendChild(row.tr)
  }

  sortGamesByProperty (/**@type keyof Game */ propertyKey, reverseOrder = false) {
    this.sortGames(
      reverseOrder
      ? (a, b) => -String(a[propertyKey]).localeCompare(String(b[propertyKey]))
      : (a, b) => String(a[propertyKey]).localeCompare(String(b[propertyKey]))
    )
  }

  unload () {
    Game.unload()
    tBody.textContent = ""
    this.updateConsoles()
    this.updateCounter(0)
    this.filePicker.value = ""
  }

  updateAllRows () {
    for (const row of this.rows) row.update()
  }

  updateColumns () {
    const gamePropertyKeys = this.columns.map(c => c.propertyKey)
    try {
      Game.validatePropertyKeys(gamePropertyKeys)
    } catch (err) {
      console.error(err.message)
    }
    const tr = tHead.querySelector("tr") ?? tHead.insertRow()
    tr.textContent = ""
    colgroup.replaceChildren()
    for (const column of this.columns) {
      const { col, th } = column
      colgroup.appendChild(col)
      tr.appendChild(th)
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
      this.seConsole.appendChild(new Option(consoleName, consoleName))
    }
  }

  updateCounter (/**@type number */ numVisibleRows) {
    this.spCounter.textContent = `${numVisibleRows} / ${Game.instances.length}`
  }

  updatePredicate () {
    const { rowsByGame } = this
    let numVisibleGames = 0
    for (const game of Game.instances) {
      if (this.predicate(game)) {
        numVisibleGames++
        rowsByGame.get(game)?.show()
      } else {
        rowsByGame.get(game)?.hide()
      }
    }
    this.updateCounter(numVisibleGames)
  }

  useCustomDateFormat () {
    const columnIndex = this.columns.findIndex(c => c.propertyKey === "releaseDate")
    if (columnIndex < 0) return
    const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
    let datestring = ""
    for (const row of this.rows) {
      const { game, tr } = row
      const { releaseDate } = game
      if (releaseDate === "TBA") datestring = "TBA"
      else {
        const [year, month = "", day = ""] = String(releaseDate).split("-")
        if (year && month && day) datestring = `${day}/${month}/${year}`
        else if (year && month) datestring = `${months[Number(month) - 1]}-${year}`
        else datestring = year
      }
      tr.cells[columnIndex].textContent = datestring
    }
  }

  useRegionalFlags () {
    const columnIndex = this.columns.findIndex(c => c.propertyKey === "region")
    if (columnIndex < 0) return
    tBody.classList.add("use-emoji-flags")
    for (const row of this.rows) {
      const { game, tr } = row
      const { region: code } = game
      const region = Region.byCode(code)
      const cell = tr.cells[columnIndex]
      if (region.useImage) {
        setPrefixImage(cell, `url(../webp/${region.code}.webp)`)
        cell.textContent = ""
      } else {
        setPrefixImage(cell, "")
        cell.textContent = region.emoji || region.code
      }
    }
    for (const region of Region.instances) {
      if (region.checkbox.nextSibling instanceof Text) {
        region.checkbox.nextSibling.data = (region.emoji || region.code.toLocaleUpperCase())
      }
    }
  }

  useIsoDateFormat () {
    const columnIndex = this.columns.findIndex(c => c.propertyKey === "releaseDate")
    if (columnIndex < 0) return
    for (const row of this.rows) {
      row.tr.cells[columnIndex].textContent = row.game.releaseDate
    }
  }

  usePlainTextRegionFlags () {
    const columnIndex = this.columns.findIndex(c => c.propertyKey === "region")
    if (columnIndex < 0) return
    tBody.classList.remove("use-emoji-flags")
    for (const row of this.rows) {
      const cell = row.tr.cells[columnIndex]
      cell.textContent = row.game.region
      setPrefixImage(cell, "")
    }
    for (const region of Region.instances) {
      if (region.checkbox.nextSibling instanceof Text) {
        region.checkbox.nextSibling.data = region.code.toLocaleUpperCase()
      }
    }
  }
}
