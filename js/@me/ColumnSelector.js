
/*
    <details class="column-picker">
        <summary>⚙️ Colonnes...</summary>
        <div class="picker-menu">
            <label><input type="checkbox" data-column="col-id" checked> ID</label>
            <label><input type="checkbox" data-column="col-nom" checked> Nom</label>
            <label><input type="checkbox" data-column="col-role" checked> Rôle</label>
            <label><input type="checkbox" data-column="col-statut" checked> Statut</label>
        </div>
    </details>
*/

export default class ColumnSelector {
    /**@type string[] */
    columnNames = []

    constructor (/**@type string[] */ columnNames = []) {
        this.columnNames.push(...columnNames)
        for (const name of this.columnNames) {
            
        }
    }


}
