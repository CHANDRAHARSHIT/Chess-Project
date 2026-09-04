/**
 * Common base for anything a run can own.
 *
 * Shared identity fields live here, owning-behavior lives on subclasses.
 * Today OdysseyRelic is the only concrete branch, but the base exists so a
 * future item type (e.g. a one-shot consumable) has somewhere to attach
 * without reshaping OdysseyGame's inventory handling.
 */
export abstract class OdysseyItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;

  protected constructor(id: string, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }
}
