/*
If you want types available everywhere without importing them,
your types.d.ts must not contain any top-level import or export statements.
As soon as you add an export, TypeScript treats it as a module, and the global types disappear.
*/

type completionStatus = (0 | 1 | 2)
type isostring = string // ISO 8601 string, possibly truncated to month or day precision. */

type Game = import("./Game.js").default

type GamePropertyKey = keyof Game

type ColumnDefinition = {
    name: string;
    propertyKey: keyof Game;
}

type RawGameEntry = {
    titleJP: string | null;
    transcription: string | null;
    titleUSCA: string | null;
    titleEU: string | null;
    titleAU: string | null;
    physicalReleaseDateJP: isostring | null;
    physicalReleaseDateUSCA: isostring | null;
    physicalReleaseDateEU: isostring | null;
    physicalReleaseDateAU: isostring | null;
    digitalReleaseDateJP: isostring | null;
    digitalReleaseDateUSCA: isostring | null;
    digitalReleaseDateEU: isostring | null;
    digitalReleaseDateAU: isostring | null;
    consoleID: string | null;
    type: string | null;
    developers: string[] | null;
    editorsJP: string[] | null;
    editorsUSCA: string[] | null;
    editorsEU: string[] | null;
    editorsAU: string[] | null;
    licensors: string[] | null;
    lineage: string | null;
    note: string | null;
}