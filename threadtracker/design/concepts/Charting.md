# Charting

## Purpose

Organize items by where they are in an ordered sequence (rows) and by which category
they are in (columns), so items about one category can be read in sequence order.

## Principle

An owner creates a chart with rows and columns and becomes its first member, and the
owner can add other members. Members can add columns and place items in cells. The
items of a chart are listed in row order, each with its row and column, so filtering
to certain rows or columns keeps that order. After an item is removed from the chart,
it is no longer listed.

## Types

```types
external User
  A person who owns a chart or is a member of it.

external Item
  The thing placed in a cell, such as a post.

opaque Labels
  An ordered list of label strings, such as the titles of a book's chapters.
```

## State

```state
a set of Charts with
  a title String
  an owner User

a seq of Rows with
  a chart Chart
  a label String
  unique chart and label

a seq of Columns with
  a chart Chart
  a label String
  unique chart and label

a set of Memberships with
  a chart Chart
  a member User
  unique chart and member

a seq of Placements with
  a unique item Item
  a chart Chart
  a row Row
  a column Column

Rule: the index of a row is its position among the rows of its chart, starting at 1
Rule: the row and column of a placement belong to the chart of that placement
```

## Actions

```actions
createChart(title: String, owner: User, rowLabels: Labels, columnLabels: Labels) : returns (chart: Chart)
  where rowLabels contains the same label twice
  then
    refuses DUPLICATE_ROW "This chart already has a row with that label."
  where columnLabels contains the same label twice
  then
    refuses DUPLICATE_COLUMN "This chart already has a column with that label."
  where the row labels and column labels are each distinct
  then
    add a new chart with title and owner
    add a new row with chart for each label in rowLabels, in order
    add a new column with chart for each label in columnLabels, in order
    add a new membership with chart and member owner
    returns chart

addMember(chart: Chart, owner: User, user: User) : returns ()
  where chart is not in Charts
  then
    refuses CHART_NOT_FOUND "There is no such chart."
  where owner is not the owner of chart
  then
    refuses NOT_OWNER "Only the owner of this chart can add members."
  where some membership has chart and member user
  then
    refuses ALREADY_MEMBER "That person is already a member of this chart."
  where owner is the owner of chart and no membership has chart and member user
  then
    add a new membership with chart and member user
    returns

addColumn(chart: Chart, label: String, user: User) : returns (column: Column)
  where chart is not in Charts
  then
    refuses CHART_NOT_FOUND "There is no such chart."
  where no membership has chart and member user
  then
    refuses NOT_MEMBER "You are not a member of this chart."
  where some column of chart has label
  then
    refuses DUPLICATE_COLUMN "This chart already has a column with that label."
  where user is a member of chart and no column of chart has label
  then
    add a new column with chart and label after the other columns of chart
    returns column

addItem(item: Item, chart: Chart, row: Row, column: Column, user: User) : returns ()
  where chart is not in Charts
  then
    refuses CHART_NOT_FOUND "There is no such chart."
  where no membership has chart and member user
  then
    refuses NOT_MEMBER "You are not a member of this chart."
  where row or column does not belong to chart
  then
    refuses NOT_IN_CHART "That chapter or literary element is not in this chart."
  where some placement has item
  then
    refuses ALREADY_PLACED "That item is already in a cell."
  where user is a member of chart, row and column belong to chart, and item is not placed
  then
    add a new placement with item, chart, row, and column
    returns

deleteItem(item: Item, chart: Chart) : returns ()
  where no placement has item and chart
  then
    refuses ITEM_NOT_FOUND "That post is not in this chart."
  where some placement has item and chart
  then
    remove that placement
    returns

checkMember(chart: Chart, user: User) : returns ()
  where chart is not in Charts
  then
    refuses CHART_NOT_FOUND "There is no such chart."
  where no membership has chart and member user
  then
    refuses NOT_MEMBER "You are not a member of this chart."
  where some membership has chart and member user
  then
    returns

checkRow(row: Row, chart: Chart) : returns (index: Number)
  where row does not belong to chart
  then
    refuses NOT_IN_CHART "That chapter or literary element is not in this chart."
  where row belongs to chart
  then
    bind index to the index of row
    returns index

checkItem(item: Item, chart: Chart) : returns (index: Number)
  where item is not placed in chart
  then
    refuses ITEM_NOT_FOUND "That post is not in this chart."
  where item is placed in chart
  then
    bind index to the index of the row item is placed in
    returns index
```

## Queries

```queries
_get(chart: Chart) : optional (title: String, owner: User)
  answers the title and owner of chart, or nothing for an unknown chart

_chartsFor(user: User) : many (chart: Chart, title: String, owner: User)
  answers every chart that user is a member of, oldest first

_rows(chart: Chart) : many (row: Row, label: String, index: Number)
  answers every row of chart with its label and index, in index order

_columns(chart: Chart) : many (column: Column, label: String)
  answers every column of chart with its label, in the order the columns were added

_items(chart: Chart) : many (item: Item, row: Row, index: Number, column: Column)
  answers every item placed in chart with its row, the index of that row, and its column
  sorted by the index of the row, then by when the item was placed
_placement(item: Item) : optional (chart: Chart)
  answers the chart that item is placed in, or nothing for an item that is not placed
```