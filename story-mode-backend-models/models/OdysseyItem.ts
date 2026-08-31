/**
 * Common base for anything a player can own during a run.
 *
 * Mirrors the reference project's Subject -> Placeable -> Item hierarchy:
 * shared identity fields live here, owning-behavior lives on subclasses.
 * Today OdysseyRelic is the only concrete branch, but the base exists so a
 * future item type (e.g. a one-shot consumable) has somewhere to attach
 * without reshaping OdysseyPlayer's inventory handling.
 */
export abstract class OdysseyItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;

  protected constructor(id: string, name: string, description: string) {
    throw new Error("Not implemented"); // would assign the three fields above
  }
}
