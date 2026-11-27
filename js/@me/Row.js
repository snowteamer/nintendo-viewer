import Game from "@me/Game.js";
import Region from "@me/Region.js";
import UI from "@me/UI.js";

export default class Row {
  game
  highlighted = false

  /**@type HTMLTableRowElement */
  tr = document.createElement("tr")

  constructor (/**@type Game */ game) {
    this.game = game
    this.update()
  }

  hide () {
    this.tr.style.display = "none"
  }

  highlight () {
    this.tr.classList.add("highlighted")
    this.highlighted = true
  }

  show () {
    this.tr.style.display = ""
  }

  unhighlight () {
    this.tr.classList.remove("highlighted")
    this.highlighted = false
  }

  // TODO: use a schema to know whether to render property values as text or HTML.
  update () {
    const { game, game: { transcription }, tr: row } = this
    if (row.cells.length) row.textContent = ""
    for (const column of UI.instance?.columns ?? []) {
      const key = column.propertyKey
      const td = row.insertCell()
      let value = game[key]
      if (key === "region") {
          if (UI.instance?.options.useRegionalFlags) value = Region.byCode(game.region).emoji
      }
      if (key === "fullTitle" && String(value).includes("<ruby")) {
          td.innerHTML = String(value)
      } else {
          td.textContent = Array.isArray(value) ? value.join(", ") : String(value)
      }
      if ((key === "fullTitle" || key === "title") && transcription) td.title = transcription
    }
  }
}
