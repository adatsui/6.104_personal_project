import { beforeEach, describe, expect, test } from "bun:test";
import {
  AlreadyMember,
  AlreadyPlaced,
  ChartingConcept,
  ChartNotFound,
  DuplicateColumn,
  DuplicateRow,
  ItemNotFound,
  NotInChart,
  NotMember,
  NotOwner,
} from "../../src/concepts/Charting.ts";
import { clear, testDb } from "../testDb.ts";

const db = testDb("charting");
const charting = new ChartingConcept(db);

beforeEach(() => clear(db));

/** A three-chapter chart owned by the teacher, with Millie as a member. */
async function edenChart() {
  const { chart } = await charting.createChart({
    title: "East of Eden",
    owner: "teacher",
    rowLabels: ["Ch. 1", "Ch. 2", "Ch. 3"],
    columnLabels: ["free will", "sibling rivalry"],
  });
  await charting.addMember({ chart, owner: "teacher", user: "millie" });
  const [ch1, ch2, ch3] = (await charting._rows({ chart })).map((r) => r.row);
  const [freeWill, rivalry] = (await charting._columns({ chart })).map((c) => c.column);
  return { chart, ch1: ch1!, ch2: ch2!, ch3: ch3!, freeWill: freeWill!, rivalry: rivalry! };
}

describe("Charting", () => {
  test("principle: members place items in cells, and items are listed in row order", async () => {
    const { chart, ch1, ch3, freeWill, rivalry } = await edenChart();
    expect(await charting._get({ chart })).toEqual([{ title: "East of Eden", owner: "teacher" }]);
    expect(await charting._rows({ chart })).toEqual([
      { row: expect.any(String), label: "Ch. 1", index: 1 },
      { row: expect.any(String), label: "Ch. 2", index: 2 },
      { row: expect.any(String), label: "Ch. 3", index: 3 },
    ]);

    // Placed out of row order, listed in row order.
    await charting.addItem({ item: "late", chart, row: ch3, column: rivalry, user: "millie" });
    await charting.addItem({ item: "early", chart, row: ch1, column: freeWill, user: "teacher" });
    expect(await charting._items({ chart })).toEqual([
      { item: "early", row: ch1, index: 1, column: freeWill },
      { item: "late", row: ch3, index: 3, column: rivalry },
    ]);

    await charting.deleteItem({ item: "early", chart });
    expect((await charting._items({ chart })).map((i) => i.item)).toEqual(["late"]);
  });

  test("within a row, items are listed in the order they were placed", async () => {
    const { chart, ch2, freeWill, rivalry } = await edenChart();
    await charting.addItem({ item: "first", chart, row: ch2, column: rivalry, user: "millie" });
    await charting.addItem({ item: "second", chart, row: ch2, column: freeWill, user: "millie" });
    expect((await charting._items({ chart })).map((i) => i.item)).toEqual(["first", "second"]);
  });

  test("the owner is the first member, and charts are listed per member", async () => {
    const { chart } = await edenChart();
    expect(await charting._chartsFor({ user: "teacher" })).toEqual([
      { chart, title: "East of Eden", owner: "teacher" },
    ]);
    expect(await charting._chartsFor({ user: "millie" })).toHaveLength(1);
    expect(await charting._chartsFor({ user: "outsider" })).toEqual([]);
  });

  test("refuses duplicate row or column labels when creating a chart", async () => {
    await expect(
      charting.createChart({ title: "t", owner: "teacher", rowLabels: ["Ch. 1", "Ch. 1"], columnLabels: [] }),
    ).rejects.toThrow(DuplicateRow);
    await expect(
      charting.createChart({ title: "t", owner: "teacher", rowLabels: ["Ch. 1"], columnLabels: ["x", "x"] }),
    ).rejects.toThrow(DuplicateColumn);
    expect(await charting._chartsFor({ user: "teacher" })).toEqual([]);
  });

  test("only the owner adds members, once each", async () => {
    const { chart } = await edenChart();
    await expect(charting.addMember({ chart, owner: "millie", user: "cal" })).rejects.toThrow(NotOwner);
    await expect(charting.addMember({ chart, owner: "teacher", user: "millie" })).rejects.toThrow(AlreadyMember);
    await expect(charting.addMember({ chart: "missing", owner: "teacher", user: "cal" })).rejects.toThrow(
      ChartNotFound,
    );
  });

  test("members add columns at the end, without repeating a label", async () => {
    const { chart } = await edenChart();
    const { column } = await charting.addColumn({ chart, label: "names", user: "millie" });
    expect((await charting._columns({ chart })).at(-1)).toEqual({ column, label: "names" });
    await expect(charting.addColumn({ chart, label: "names", user: "teacher" })).rejects.toThrow(DuplicateColumn);
    await expect(charting.addColumn({ chart, label: "other", user: "outsider" })).rejects.toThrow(NotMember);
  });

  test("refuses placing an item for a non-member, outside the chart, or twice", async () => {
    const { chart, ch1, freeWill } = await edenChart();
    const other = await edenChart();
    await expect(
      charting.addItem({ item: "a", chart, row: ch1, column: freeWill, user: "outsider" }),
    ).rejects.toThrow(NotMember);
    await expect(
      charting.addItem({ item: "a", chart, row: other.ch1, column: freeWill, user: "millie" }),
    ).rejects.toThrow(NotInChart);
    await charting.addItem({ item: "a", chart, row: ch1, column: freeWill, user: "millie" });
    await expect(
      charting.addItem({ item: "a", chart, row: ch1, column: freeWill, user: "millie" }),
    ).rejects.toThrow(AlreadyPlaced);
  });

  test("refuses removing an item that is not in the chart", async () => {
    const { chart } = await edenChart();
    await expect(charting.deleteItem({ item: "missing", chart })).rejects.toThrow(ItemNotFound);
  });

  test("checkMember passes members and refuses everyone else", async () => {
    const { chart } = await edenChart();
    expect(await charting.checkMember({ chart, user: "millie" })).toEqual({});
    await expect(charting.checkMember({ chart, user: "outsider" })).rejects.toThrow(NotMember);
    await expect(charting.checkMember({ chart: "missing", user: "millie" })).rejects.toThrow(ChartNotFound);
  });

  test("checkRow returns the row's index, only for this chart", async () => {
    const { chart, ch2 } = await edenChart();
    const other = await edenChart();
    expect(await charting.checkRow({ row: ch2, chart })).toEqual({ index: 2 });
    await expect(charting.checkRow({ row: other.ch2, chart })).rejects.toThrow(NotInChart);
  });

  test("checkItem returns the index of the item's row, only for this chart", async () => {
    const { chart, ch3, freeWill } = await edenChart();
    const other = await edenChart();
    await charting.addItem({ item: "a", chart, row: ch3, column: freeWill, user: "millie" });
    expect(await charting.checkItem({ item: "a", chart })).toEqual({ index: 3 });
    await expect(charting.checkItem({ item: "a", chart: other.chart })).rejects.toThrow(ItemNotFound);
  });

  test("_placement answers the chart an item is in, and nothing once it is removed", async () => {
    const { chart, ch1, freeWill } = await edenChart();
    expect(await charting._placement({ item: "idea" })).toEqual([]);

    await charting.addItem({ item: "idea", chart, row: ch1, column: freeWill, user: "millie" });
    expect(await charting._placement({ item: "idea" })).toEqual([{ chart }]);

    await charting.deleteItem({ item: "idea", chart });
    expect(await charting._placement({ item: "idea" })).toEqual([]);
  });
});
