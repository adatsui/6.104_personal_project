import { MongoServerError, type Collection, type Db } from "mongodb";

export class ChartNotFound extends Error {}
export class DuplicateRow extends Error {}
export class DuplicateColumn extends Error {}
export class NotOwner extends Error {}
export class AlreadyMember extends Error {}
export class NotMember extends Error {}
export class NotInChart extends Error {}
export class AlreadyPlaced extends Error {}
export class ItemNotFound extends Error {}

interface Chart {
  _id: string;
  title: string;
  owner: string;
  created: number;
}

interface Row {
  _id: string;
  chart: string;
  label: string;
  // The row's position in its chart, starting at 1. Rows never move, so it is stored.
  index: number;
}

interface Column {
  _id: string;
  chart: string;
  label: string;
  position: number;
}

interface Membership {
  _id: string;
  chart: string;
  member: string;
}

interface Placement {
  // An item is placed at most once, so the item is the placement's identity.
  _id: string;
  chart: string;
  row: string;
  column: string;
  index: number;
  placed: number;
}

const DUPLICATE_ROW = "This chart already has a row with that label.";
const DUPLICATE_COLUMN = "This chart already has a column with that label.";
const NOT_MEMBER = "You are not a member of this chart.";
const NOT_IN_CHART = "That chapter or literary element is not in this chart.";
const CHART_NOT_FOUND = "There is no such chart.";
const ITEM_NOT_FOUND = "That post is not in this chart.";

function hasDuplicate(labels: readonly string[]): boolean {
  return new Set(labels).size !== labels.length;
}

export class ChartingConcept {
  private readonly charts: Collection<Chart>;
  private readonly rows: Collection<Row>;
  private readonly columns: Collection<Column>;
  private readonly memberships: Collection<Membership>;
  private readonly placements: Collection<Placement>;
  private indexed = false;
  private clock = 0;

  constructor(db: Db) {
    this.charts = db.collection<Chart>("charting.charts");
    this.rows = db.collection<Row>("charting.rows");
    this.columns = db.collection<Column>("charting.columns");
    this.memberships = db.collection<Membership>("charting.memberships");
    this.placements = db.collection<Placement>("charting.placements");
  }

  // Created on first use, not in the constructor, so `generate` and `check` never touch the database.
  async #ensureIndexes() {
    if (this.indexed) return;
    await this.rows.createIndex({ chart: 1, label: 1 }, { unique: true });
    await this.columns.createIndex({ chart: 1, label: 1 }, { unique: true });
    await this.memberships.createIndex({ chart: 1, member: 1 }, { unique: true });
    await this.placements.createIndex({ chart: 1, index: 1, placed: 1 });
    this.indexed = true;
  }

  /** A strictly increasing stamp, for "in the order added" without relying on clock ties. */
  #tick(): number {
    this.clock = Math.max(this.clock + 1, Date.now());
    return this.clock;
  }

  async #existingChart(chart: string): Promise<Chart> {
    const found = await this.charts.findOne({ _id: chart });
    if (found === null) throw new ChartNotFound(CHART_NOT_FOUND);
    return found;
  }

  async #isMember(chart: string, user: string): Promise<boolean> {
    return (await this.memberships.findOne({ chart, member: user })) !== null;
  }

  async createChart({
    title,
    owner,
    rowLabels,
    columnLabels,
  }: {
    title: string;
    owner: string;
    rowLabels: string[];
    columnLabels: string[];
  }) {
    if (hasDuplicate(rowLabels)) throw new DuplicateRow(DUPLICATE_ROW);
    if (hasDuplicate(columnLabels)) throw new DuplicateColumn(DUPLICATE_COLUMN);
    await this.#ensureIndexes();
    const chart = crypto.randomUUID();
    await this.charts.insertOne({ _id: chart, title, owner, created: this.#tick() });
    if (rowLabels.length > 0) {
      await this.rows.insertMany(
        rowLabels.map((label, i) => ({ _id: crypto.randomUUID(), chart, label, index: i + 1 })),
      );
    }
    if (columnLabels.length > 0) {
      await this.columns.insertMany(
        columnLabels.map((label) => ({ _id: crypto.randomUUID(), chart, label, position: this.#tick() })),
      );
    }
    await this.memberships.insertOne({ _id: crypto.randomUUID(), chart, member: owner });
    return { chart };
  }

  async addMember({ chart, owner, user }: { chart: string; owner: string; user: string }) {
    const found = await this.#existingChart(chart);
    if (found.owner !== owner) {
      throw new NotOwner("Only the owner of this chart can add members.");
    }
    await this.#ensureIndexes();
    try {
      await this.memberships.insertOne({ _id: crypto.randomUUID(), chart, member: user });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new AlreadyMember("That person is already a member of this chart.");
      }
      throw error;
    }
    return {};
  }

  async addColumn({ chart, label, user }: { chart: string; label: string; user: string }) {
    await this.#existingChart(chart);
    if (!(await this.#isMember(chart, user))) throw new NotMember(NOT_MEMBER);
    await this.#ensureIndexes();
    const column = crypto.randomUUID();
    try {
      await this.columns.insertOne({ _id: column, chart, label, position: this.#tick() });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new DuplicateColumn(DUPLICATE_COLUMN);
      }
      throw error;
    }
    return { column };
  }

  async addItem({
    item,
    chart,
    row,
    column,
    user,
  }: {
    item: string;
    chart: string;
    row: string;
    column: string;
    user: string;
  }) {
    await this.#existingChart(chart);
    if (!(await this.#isMember(chart, user))) throw new NotMember(NOT_MEMBER);
    const foundRow = await this.rows.findOne({ _id: row, chart });
    const foundColumn = await this.columns.findOne({ _id: column, chart });
    if (foundRow === null || foundColumn === null) throw new NotInChart(NOT_IN_CHART);
    await this.#ensureIndexes();
    try {
      await this.placements.insertOne({
        _id: item,
        chart,
        row,
        column,
        index: foundRow.index,
        placed: this.#tick(),
      });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new AlreadyPlaced("That item is already in a cell.");
      }
      throw error;
    }
    return {};
  }

  async deleteItem({ item, chart }: { item: string; chart: string }) {
    const result = await this.placements.deleteOne({ _id: item, chart });
    if (result.deletedCount === 0) throw new ItemNotFound(ITEM_NOT_FOUND);
    return {};
  }

  async checkMember({ chart, user }: { chart: string; user: string }) {
    await this.#existingChart(chart);
    if (!(await this.#isMember(chart, user))) throw new NotMember(NOT_MEMBER);
    return {};
  }

  async checkRow({ row, chart }: { row: string; chart: string }) {
    const found = await this.rows.findOne({ _id: row, chart });
    if (found === null) throw new NotInChart(NOT_IN_CHART);
    return { index: found.index };
  }

  async checkItem({ item, chart }: { item: string; chart: string }) {
    const found = await this.placements.findOne({ _id: item, chart });
    if (found === null) throw new ItemNotFound(ITEM_NOT_FOUND);
    return { index: found.index };
  }

  async _get({ chart }: { chart: string }) {
    const found = await this.charts.findOne({ _id: chart });
    return found === null ? [] : [{ title: found.title, owner: found.owner }];
  }

  async _chartsFor({ user }: { user: string }) {
    const memberships = await this.memberships.find({ member: user }).toArray();
    const charts = await this.charts
      .find({ _id: { $in: memberships.map((m) => m.chart) } })
      .sort({ created: 1 })
      .toArray();
    return charts.map(({ _id, title, owner }) => ({ chart: _id, title, owner }));
  }

  async _rows({ chart }: { chart: string }) {
    const rows = await this.rows.find({ chart }).sort({ index: 1 }).toArray();
    return rows.map(({ _id, label, index }) => ({ row: _id, label, index }));
  }

  async _columns({ chart }: { chart: string }) {
    const columns = await this.columns.find({ chart }).sort({ position: 1 }).toArray();
    return columns.map(({ _id, label }) => ({ column: _id, label }));
  }

  async _items({ chart }: { chart: string }) {
    const placements = await this.placements.find({ chart }).sort({ index: 1, placed: 1 }).toArray();
    return placements.map(({ _id, row, index, column }) => ({ item: _id, row, index, column }));
  }

  async _placement({ item }: { item: string }) {
    const found = await this.placements.findOne({ _id: item });
    return found === null ? [] : [{ chart: found.chart }];
  }
}
