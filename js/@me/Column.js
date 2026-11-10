export default class Column {
  highlighted = false
  selectedValue = ""
  sortOrder = ""

  /**@type HTMLTableColElement */
  col = document.createElement("col")
  /**@type HTMLSelectElement */
  se = document.createElement("select")
  /**@type HTMLTableCellElement */
  th = document.createElement("th")

  constructor (/**@type ColumnDefinition */ definition) {
    this.name = definition.name
    this.propertyKey = definition.propertyKey
    this.th.textContent = this.name
  }

  highlight () {
    this.col?.classList.add("highlighted")
    this.highlighted = true
  }

  unhighlight () {
    this.col?.classList.remove("highlighted")
    this.highlighted = false
  }
}
