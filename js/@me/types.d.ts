/*
If you want types available everywhere without importing them,
your types.d.ts must not contain any top-level import or export statements.
As soon as you add an export, TypeScript treats it as a module, and the global types disappear.
*/

type Game = import("./Game.js").default

type ColumnDefinition = {
    name: string;
    propertyKey: keyof Game;
}
