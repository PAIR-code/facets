/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {Grid, GridAlignment} from '../grid';
import * as sorting from '../sorting';

const {expect} = chai;

// Utility type used for testing.
interface Crayon {
  color: string;
  x?: number;
  y?: number;
}

describe('Grid', () => {

  describe('arrange', () => {

    it('should put everything in a single cell by default', () => {
      //  -  +---+
      //  .  |baz|
      //  2  +---+---+
      //  .  |foo|bar|
      //  -  +---+---+
      //     |. .2. .|

      const items: {name: string, x?: number, y?: number}[] =
          [{name: 'foo'}, {name: 'bar'}, {name: 'baz'}];

      const grid = new Grid(items);
      grid.arrange();
      expect(Object.keys(grid.cells).length).to.equal(1);
      expect(grid.width).to.equal(2);
      expect(grid.height).to.equal(2);

      const cell = grid.getCell(null!, null!)!;
      expect(cell.items).to.deep.equal(items);
      expect(cell.x).to.equal(0);
      expect(cell.y).to.equal(0);
      expect(cell.width).to.equal(2);
      expect(cell.height).to.equal(2);
      expect(cell.innerWidth).to.equal(2);
      expect(cell.innerHeight).to.equal(2);
      expect(cell.contentX).to.equal(0);
      expect(cell.contentY).to.equal(0);

      const [fooItem, barItem, bazItem] = items;
      expect(fooItem.x).to.equal(0);
      expect(fooItem.y).to.equal(0);
      expect(barItem.x).to.equal(1);
      expect(barItem.y).to.equal(0);
      expect(bazItem.x).to.equal(0);
      expect(bazItem.y).to.equal(1);
    });

    it('should stack wide items vertically by default', () => {
      //  -  +-------+-------+
      //  .  |   G   |   H   |
      //  .  +-------+-------+
      //  .  |   E   |   F   |
      //  4  +-------+-------+
      //  .  |   C   |   D   |
      //  .  +-------+-------+
      //  .  |   A   |   B   |
      //  -  +-------+-------+
      //     |. . . .4. . . .|

      type Item = {name: string, x?: number, y?: number};

      const items: Item[] = 'ABCDEFGH'.split('').map(ch => ({name: ch}));

      const grid = new Grid(items);
      grid.itemAspectRatio = 2;
      grid.arrange();
      expect(Object.keys(grid.cells).length).to.equal(1);
      expect(grid.width).to.equal(4);
      expect(grid.height).to.equal(4);

      const cell = grid.getCell(null!, null!)!;
      expect(cell.items).to.deep.equal(items);
      expect(cell.x).to.equal(0);
      expect(cell.y).to.equal(0);
      expect(cell.width).to.equal(4);
      expect(cell.height).to.equal(4);
      expect(cell.innerWidth).to.equal(4);
      expect(cell.innerHeight).to.equal(4);
      expect(cell.contentX).to.equal(0);
      expect(cell.contentY).to.equal(0);

      const [A, B, C, D, E, F, G, H] = cell.items as Item[];
      expect(A.x).to.equal(0);
      expect(A.y).to.equal(0);
      expect(B.x).to.equal(2);
      expect(B.y).to.equal(0);
      expect(C.x).to.equal(0);
      expect(C.y).to.equal(1);
      expect(D.x).to.equal(2);
      expect(D.y).to.equal(1);
      expect(E.x).to.equal(0);
      expect(E.y).to.equal(2);
      expect(F.x).to.equal(2);
      expect(F.y).to.equal(2);
      expect(G.x).to.equal(0);
      expect(G.y).to.equal(3);
      expect(H.x).to.equal(2);
      expect(H.y).to.equal(3);
    });

    it('should assign sibling cells', () => {
      //  -  +---+---+---+
      //  .  | G | H | I |
      //  .  +---+---+---+
      //  3  | D | E | F |
      //  .  +---+---+---+
      //  .  | A | B | C |
      //  -  +---+---+---+
      //     |. . .3. . .|

      type Item = {name: string, row: number, col: number};

      const items: Item[] = [
        {name: 'A', row: 0, col: 0},
        {name: 'B', row: 0, col: 1},
        {name: 'C', row: 0, col: 2},
        {name: 'D', row: 1, col: 0},
        {name: 'E', row: 1, col: 1},
        {name: 'F', row: 1, col: 2},
        {name: 'G', row: 2, col: 0},
        {name: 'H', row: 2, col: 1},
        {name: 'I', row: 2, col: 2},
      ];

      const grid = new Grid(items);
      grid.cellMargin = 0;
      grid.verticalFacet = (item: Item) => item.row;
      grid.horizontalFacet = (item: Item) => item.col;
      grid.verticalKeyCompare = sorting.numberCompare;
      grid.horizontalKeyCompare = sorting.numberCompare;
      grid.arrange();

      expect(Object.keys(grid.cells).length).to.equal(9);
      expect(grid.width).to.equal(3);
      expect(grid.height).to.equal(3);

      const [A, B, C, D, E, F, G, H, I] =
          items.map(item => grid.getCell(item.row, item.col)!);

      expect((A.siblings.above!.items[0] as Item).name).to.equal('D');
      expect((A.siblings.right!.items[0] as Item).name).to.equal('B');
      expect(A.siblings.below == null).to.equal(true);
      expect(A.siblings.left == null).to.equal(true);

      expect((B.siblings.above!.items[0] as Item).name).to.equal('E');
      expect((B.siblings.left!.items[0] as Item).name).to.equal('A');
      expect((B.siblings.right!.items[0] as Item).name).to.equal('C');
      expect(B.siblings.below == null).to.equal(true);

      expect((C.siblings.above!.items[0] as Item).name).to.equal('F');
      expect((C.siblings.left!.items[0] as Item).name).to.equal('B');
      expect(C.siblings.below == null).to.equal(true);
      expect(C.siblings.right == null).to.equal(true);

      expect((D.siblings.above!.items[0] as Item).name).to.equal('G');
      expect((D.siblings.below!.items[0] as Item).name).to.equal('A');
      expect((D.siblings.right!.items[0] as Item).name).to.equal('E');
      expect(D.siblings.left == null).to.equal(true);

      expect((E.siblings.above!.items[0] as Item).name).to.equal('H');
      expect((E.siblings.below!.items[0] as Item).name).to.equal('B');
      expect((E.siblings.left!.items[0] as Item).name).to.equal('D');
      expect((E.siblings.right!.items[0] as Item).name).to.equal('F');

      expect((F.siblings.above!.items[0] as Item).name).to.equal('I');
      expect((F.siblings.below!.items[0] as Item).name).to.equal('C');
      expect((F.siblings.left!.items[0] as Item).name).to.equal('E');
      expect(F.siblings.right == null).to.equal(true);

      expect((G.siblings.below!.items[0] as Item).name).to.equal('D');
      expect((G.siblings.right!.items[0] as Item).name).to.equal('H');
      expect(G.siblings.above == null).to.equal(true);
      expect(G.siblings.left == null).to.equal(true);

      expect((H.siblings.below!.items[0] as Item).name).to.equal('E');
      expect((H.siblings.left!.items[0] as Item).name).to.equal('G');
      expect((H.siblings.right!.items[0] as Item).name).to.equal('I');
      expect(H.siblings.above == null).to.equal(true);

      expect((I.siblings.below!.items[0] as Item).name).to.equal('F');
      expect((I.siblings.left!.items[0] as Item).name).to.equal('H');
      expect(I.siblings.above == null).to.equal(true);
      expect(I.siblings.right == null).to.equal(true);
    });

    it('should arrange items horizontally by a string field', () => {
      //       0        1        2
      //  -  +---+    +---+    +---+
      //  1  | b |    | g |    | r |
      //  -  +---+    +---+    +---+
      //     |. . . . . 5 . . . . .|

      const crayons: Crayon[] =
          [{color: 'red'}, {color: 'green'}, {color: 'blue'}];

      const grid = new Grid(crayons);
      grid.verticalFacet = (crayon: Crayon) => null!;
      grid.horizontalFacet = (crayon: Crayon) => crayon.color;
      grid.arrange();

      expect(Object.keys(grid.cells).length).to.equal(3);
      expect(grid.width).to.equal(5);
      expect(grid.height).to.equal(1);

      // Confirm sort order (left to right).
      expect(grid.verticalKeys).to.deep.equal([null]);
      expect(grid.horizontalKeys).to.deep.equal(['blue', 'green', 'red']);

      // Confirm cell dimensions and positions.
      const blueCell = grid.getCell(null!, 'blue')!;
      const redCell = grid.getCell(null!, 'red')!;
      const greenCell = grid.getCell(null!, 'green')!;

      expect(blueCell.x).to.equal(0);
      expect(blueCell.y).to.equal(0);
      expect(blueCell.width).to.equal(1);
      expect(blueCell.height).to.equal(1);

      expect(greenCell.x).to.equal(2);
      expect(greenCell.y).to.equal(0);
      expect(greenCell.width).to.equal(1);
      expect(greenCell.height).to.equal(1);

      expect(redCell.x).to.equal(4);
      expect(redCell.y).to.equal(0);
      expect(redCell.width).to.equal(1);
      expect(redCell.height).to.equal(1);

      // Confirm item positions.
      const [red, green, blue] = crayons;
      expect(blue.x).to.equal(0);
      expect(blue.y).to.equal(0);
      expect(green.x).to.equal(2);
      expect(green.y).to.equal(0);
      expect(red.x).to.equal(4);
      expect(red.y).to.equal(0);
    });

    it('should arrange items vertically in alphabetical order', () => {
      //  -  +---+
      //  .  | b | 2
      //  .  +---+
      //  .
      //  .  +---+
      //  5  | g | 1
      //  .  +---+
      //  .
      //  .  +---+
      //  .  | r | 0
      //  -  +---+
      //     |.1.|

      const crayons: Crayon[] =
          [{color: 'red'}, {color: 'green'}, {color: 'blue'}];

      const grid = new Grid(crayons);
      grid.verticalFacet = (crayon: Crayon) => crayon.color;
      grid.horizontalFacet = (crayon: Crayon) => null!;
      grid.arrange();

      expect(Object.keys(grid.cells).length).to.equal(3);
      expect(grid.width).to.equal(1);
      expect(grid.height).to.equal(5);

      // Confirm sort order of vertical keys (top to bottom).
      expect(grid.verticalKeys).to.deep.equal(['red', 'green', 'blue']);
      expect(grid.horizontalKeys).to.deep.equal([null]);

      // Confirm cell contets, dimensions, and positions.
      const redCell = grid.getCell('red', null!)!;
      const greenCell = grid.getCell('green', null!)!;
      const blueCell = grid.getCell('blue', null!)!;

      expect(blueCell.x).to.equal(0);
      expect(blueCell.y).to.equal(4);
      expect(blueCell.width).to.equal(1);
      expect(blueCell.height).to.equal(1);

      expect(greenCell.x).to.equal(0);
      expect(greenCell.y).to.equal(2);
      expect(greenCell.width).to.equal(1);
      expect(greenCell.height).to.equal(1);

      expect(redCell.x).to.equal(0);
      expect(redCell.y).to.equal(0);
      expect(redCell.width).to.equal(1);
      expect(redCell.height).to.equal(1);

      // Confirm item positions.
      const [red, green, blue] = crayons;
      expect(blue.x).to.equal(0);
      expect(blue.y).to.equal(4);
      expect(green.x).to.equal(0);
      expect(green.y).to.equal(2);
      expect(red.x).to.equal(0);
      expect(red.y).to.equal(0);
    });

    it('should respect the minimum cell aspect ratio', () => {
      //  -   +------+
      //  1   |<><><>|
      //  -   +------+
      //
      //      |. .3 .|

      const grid = new Grid([{}, {}, {}]);
      grid.minCellAspectRatio = 3;

      grid.arrange();

      expect(grid.height).to.equal(1);
      expect(grid.width).to.equal(3);
    });

    it('should respect the maximum cell aspect ratio', () => {
      //  -   +--+
      //  .   |<>|
      //  .   |<>|
      //  4   |<>|
      //  .   |<>|
      //  -   +--+
      //
      //      |.1|

      const grid = new Grid([{}, {}, {}, {}]);
      grid.maxCellAspectRatio = 1 / 4;

      grid.arrange();

      expect(grid.height).to.equal(4);
      expect(grid.width).to.equal(1);
    });

  });

  describe('facetItemsIntoCells', () => {

    it('should create keys using default string sort', () => {
      const items = [9, 10, 11, 'red', 'green', 'blue'];

      const grid = new Grid(items);
      grid.verticalFacet = (item: number | string) => item;
      grid.horizontalFacet = (item: number | string) => item;

      grid.facetItemsIntoCells();

      expect(grid.verticalKeys).to.deep.equal([
        11, 10, 9, 'red', 'green', 'blue'
      ]);
      expect(grid.horizontalKeys).to.deep.equal([
        9, 10, 11, 'blue', 'green', 'red'
      ]);
    });

    it('should create keys using numeric sort', () => {
      const items = [9, 10, 11, 'red', 'green', 'blue'];

      const grid = new Grid(items);
      grid.verticalFacet = (item: number | string) => item;
      grid.horizontalFacet = (item: number | string) => item;
      grid.verticalKeyCompare = sorting.numberCompare;
      grid.horizontalKeyCompare = sorting.numberCompare;

      grid.facetItemsIntoCells();

      expect(grid.verticalKeys).to.deep.equal([
        'blue', 'green', 'red', 9, 10, 11
      ]);
      expect(grid.horizontalKeys).to.deep.equal([
        'blue', 'green', 'red', 9, 10, 11
      ]);
    });

  });

  describe('computeGridAspectRatio', () => {

    it('should return 1 for simple single-cell grid', () => {
      //  -   +--+
      //  1   |  |
      //  -   +--+
      //
      //      |1.|

      const grid = new Grid([10]);
      grid.verticalFacet = (item: number) => item;
      grid.horizontalFacet = (item: number) => item;

      grid.facetItemsIntoCells();

      expect(grid.computeGridAspectRatio(1)).to.equal(1);
    });

    it('should return 3 for a single-cell grid with left/right padding', () => {
      //  -   +------+
      //  1   |::  ::|
      //  -   +------+
      //
      //      |. .3 .|

      const grid = new Grid([10]);
      grid.cellPadding.left = 1;
      grid.cellPadding.right = 1;
      grid.verticalFacet = (item: number) => item;
      grid.horizontalFacet = (item: number) => item;

      grid.facetItemsIntoCells();

      expect(grid.computeGridAspectRatio(1)).to.equal(3);
    });

    it('should return 6 for a single-cell with padding and item aspect', () => {
      //  -   +------------+
      //  1   |::::    ::::|
      //  -   +------------+
      //
      //      |. . . 6. . .|

      const grid = new Grid([10]);
      grid.itemAspectRatio = 2;
      grid.cellPadding.left = 1;
      grid.cellPadding.right = 1;
      grid.verticalFacet = (item: number) => item;
      grid.horizontalFacet = (item: number) => item;

      grid.facetItemsIntoCells();

      expect(grid.computeGridAspectRatio(1)).to.equal(6);
    });

    it('should return 1 for a single-cell grid with uniform padding', () => {
      //  -   +------+
      //  .   |::::::|
      //  3   |::  ::|
      //  .   |::::::|
      //  -   +------+
      //
      //      |. .3 .|

      const grid = new Grid([10]);
      grid.cellPadding.bottom = 1;
      grid.cellPadding.left = 1;
      grid.cellPadding.right = 1;
      grid.cellPadding.top = 1;
      grid.verticalFacet = (item: number) => item;
      grid.horizontalFacet = (item: number) => item;

      grid.facetItemsIntoCells();

      expect(grid.computeGridAspectRatio(1)).to.equal(1);
    });

    it('should return 2 for 1x1 grid of 1 item with aspect ratio 2', () => {
      //  -   +-----+
      //  1   |     |
      //  -   +-----+
      //
      //      |. 2 .|

      const grid = new Grid([10]);
      grid.itemAspectRatio = 2;
      grid.verticalFacet = (item: number) => item;
      grid.horizontalFacet = (item: number) => item;

      grid.facetItemsIntoCells();

      expect(grid.computeGridAspectRatio(1)).to.equal(2);
    });

    it('should return 3 for a 1x3 cell grid with no cell margin', () => {
      //  -   +--++--++--+
      //  1   |  ||  ||  |
      //  -   +--++--++--+
      //
      //      |. . 3. . .|

      const grid = new Grid([9, 10, 11]);
      grid.cellMargin = 0;
      grid.verticalFacet = (item: number) => null!;
      grid.horizontalFacet = (item: number) => item;

      grid.facetItemsIntoCells();

      expect(grid.computeGridAspectRatio(1)).to.equal(3);
    });

    it('should return 1/3 for a 3x1 cell grid with no cell margin', () => {
      //  -   +--+
      //  .   |  |
      //  .   +==+
      //  3   |  |
      //  .   +==+
      //  .   |  |
      //  -   +--+
      //
      //      |1.|

      const grid = new Grid([9, 10, 11]);
      grid.cellMargin = 0;
      grid.verticalFacet = (item: number) => item;
      grid.horizontalFacet = (item: number) => null!;

      grid.facetItemsIntoCells();

      expect(grid.computeGridAspectRatio(1)).to.be.closeTo(1 / 3, 1e-9);
    });

    it('should return 1/5 for a 3x1 cell grid with cell margin 1', () => {
      //  -   +--+
      //  .   |  |
      //  .   +--+
      //  .
      //  .   +--+
      //  5   |  |
      //  .   +--+
      //  .
      //  .   +--+
      //  .   |  |
      //  -   +--+
      //
      //      |1.|

      const grid = new Grid([9, 10, 11]);
      grid.cellMargin = 1;
      grid.verticalFacet = (item: number) => item;
      grid.horizontalFacet = (item: number) => null!;

      grid.facetItemsIntoCells();

      expect(grid.computeGridAspectRatio(1)).to.be.closeTo(1 / 5, 1e-9);
    });

    it('should return 1 for a 4x4 cell grid with no cell margin', () => {
      //  -   +--++--++--++--+
      //  .   |  ||  ||  ||  |
      //  .   +==++==++==++==+
      //  .   |  ||  ||  ||  |
      //  4   +==++==++==++==+          4 / 4 => 1
      //  .   |  ||  ||  ||  |
      //  .   +==++==++==++==+
      //  .   |  ||  ||  ||  |
      //  -   +--++--++--++--+
      //
      //      |. . . 4. . . .|

      const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

      const grid = new Grid(items);
      grid.cellMargin = 0;
      grid.verticalFacet = (item: number) => item % 4;
      grid.horizontalFacet = (item: number) => Math.floor(item / 4);

      grid.facetItemsIntoCells();

      expect(grid.computeGridAspectRatio(1)).to.equal(1);
    });

    it('should return 1 for a 4x4 cell grid with cell margin 1', () => {
      //  -   +--+    +--+    +--+    +--+
      //  .   |  |    |  |    |  |    |  |
      //  .   +--+    +--+    +--+    +--+
      //  .
      //  .   +--+    +--+    +--+    +--+
      //  .   |  |    |  |    |  |    |  |
      //  .   +--+    +--+    +--+    +--+
      //  7                                     7 / 7 => 1
      //  .   +--+    +--+    +--+    +--+
      //  .   |  |    |  |    |  |    |  |
      //  .   +--+    +--+    +--+    +--+
      //  .
      //  .   +--+    +--+    +--+    +--+
      //  .   |  |    |  |    |  |    |  |
      //  -   +--+    +--+    +--+    +--+
      //
      //      |. . . . . . 7. . . . . . .|

      const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

      const grid = new Grid(items);
      grid.cellMargin = 1;
      grid.verticalFacet = (item: number) => item % 4;
      grid.horizontalFacet = (item: number) => Math.floor(item / 4);

      grid.facetItemsIntoCells();

      expect(grid.verticalKeys.length).to.equal(4);
      expect(grid.horizontalKeys.length).to.equal(4);
      expect(grid.longestCellLength).to.equal(1);

      expect(grid.computeGridAspectRatio(1)).to.equal(1);
    });

    it('should give 3/2 for a Tight 2x2 cell grid', () => {
      //  -   +----++--+
      //  .   |    ||<>|
      //  2   +----++--+         3 / 2
      //  .   |<><>||<>|
      //  -   +----++--+
      //
      //      |. . 3. .|

      const items = [0, 0, 1, 3];

      const grid = new Grid(items);
      grid.cellMargin = 0;
      grid.verticalFacet = (item: number) => (item / 2) >> 0;
      grid.horizontalFacet = (item: number) => item % 2;

      grid.facetItemsIntoCells();

      grid.verticalGridAlignment = GridAlignment.Tight;
      grid.horizontalGridAlignment = GridAlignment.Tight;

      expect(grid.computeGridAspectRatio(1)).to.equal(3 / 2);
    });

    it('should give 2 for a Uniform 2x2 cell grid', () => {
      //  -   +----++----+
      //  .   |    ||<>  |
      //  2   +----++----+         4 / 2 => 2
      //  .   |<><>||<>  |
      //  -   +----++----+
      //
      //      |. . 4 . . |

      const items = [0, 0, 1, 3];

      const grid = new Grid(items);
      grid.cellMargin = 0;
      grid.verticalFacet = (item: number) => (item / 2) >> 0;
      grid.horizontalFacet = (item: number) => item % 2;

      grid.facetItemsIntoCells();

      grid.verticalGridAlignment = GridAlignment.Uniform;
      grid.horizontalGridAlignment = GridAlignment.Uniform;

      expect(grid.computeGridAspectRatio(1)).to.equal(2);
    });

    it('should return 3/2 for a 2x3 grid of 6 items', () => {
      //  -   +--++--++--+
      //  .   |  ||  ||  |
      //  2   +==++==++==+
      //  .   |  ||  ||  |
      //  -   +--++--++--+
      //
      //      |. . 3. . .|

      const grid = new Grid([1, 2, 3, 4, 5, 6]);
      grid.cellMargin = 0;
      grid.verticalFacet = (item: number) => item % 2;
      grid.horizontalFacet = (item: number) => item % 3;

      grid.facetItemsIntoCells();

      expect(grid.verticalKeys.length).to.equal(2);
      expect(grid.horizontalKeys.length).to.equal(3);
      expect(grid.longestCellLength).to.equal(1);

      expect(grid.computeGridAspectRatio(1)).to.equal(3 / 2);
    });

    it('should return 3/4 for a 2x3 grid of 12 items, cell ratio 1/2', () => {
      //  -   +--++--++--+
      //  .   |  ||  ||  |
      //  .   +--++--++--+
      //  .   |  ||  ||  |
      //  4   +==++==++==+
      //  .   |  ||  ||  |
      //  .   +--++--++--+
      //  .   |  ||  ||  |
      //  -   +--++--++--+
      //
      //      |. . 3. . .|

      const grid = new Grid([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      grid.cellMargin = 0;
      grid.verticalFacet = (item: number) => item % 2;
      grid.horizontalFacet = (item: number) => item % 3;

      grid.facetItemsIntoCells();

      expect(grid.verticalKeys.length).to.equal(2);
      expect(grid.horizontalKeys.length).to.equal(3);
      expect(grid.longestCellLength).to.equal(2);

      expect(grid.computeGridAspectRatio(1 / 2)).to.equal(3 / 4);
    });

    it('should give 1 for 2x3 grid, 12 items, cell ratio 1/2, margin:1', () => {
      //  -   +--+    +--+    +--+
      //  .   |  |    |  |    |  |
      //  .   +--+    +--+    +--+
      //  .   |  |    |  |    |  |
      //  .   +--+    +--+    +--+
      //  5                                 5 / 5 => 1
      //  .   +--+    +--+    +--+
      //  .   |  |    |  |    |  |
      //  .   +--+    +--+    +--+
      //  .   |  |    |  |    |  |
      //  -   +--+    +--+    +--+
      //
      //      |. . . . 5. . . . .|

      const grid = new Grid([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      grid.cellMargin = 1;
      grid.verticalFacet = (item: number) => item % 2;
      grid.horizontalFacet = (item: number) => item % 3;

      grid.facetItemsIntoCells();

      expect(grid.verticalKeys.length).to.equal(2);
      expect(grid.horizontalKeys.length).to.equal(3);
      expect(grid.longestCellLength).to.equal(2);

      expect(grid.computeGridAspectRatio(1 / 2)).to.equal(1);
    });

    it('should give 8/3 for 2x3 grid, 12 items, cell ratio 2, margin:1', () => {
      //  -   +--+--+    +--+--+    +--+--+
      //  .   |  |  |    |  |  |    |  |  |
      //  .   +--+--+    +--+--+    +--+--+
      //  3
      //  .   +--+--+    +--+--+    +--+--+
      //  .   |  |  |    |  |  |    |  |  |
      //  -   +--+--+    +--+--+    +--+--+
      //
      //      |. . . . . . .8. . . . . . .|

      const grid = new Grid([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      grid.cellMargin = 1;
      grid.verticalFacet = (item: number) => item % 2;
      grid.horizontalFacet = (item: number) => item % 3;

      grid.facetItemsIntoCells();

      expect(grid.verticalKeys.length).to.equal(2);
      expect(grid.horizontalKeys.length).to.equal(3);
      expect(grid.longestCellLength).to.equal(2);

      expect(grid.computeGridAspectRatio(2)).to.be.closeTo(8 / 3, 1e-9);
    });

    it('should give 10/4 for 2x3 grid, 6 items, item ratio 2, margin:1', () => {
      //  -   +-----+       +-----+       +-----+
      //  .   |     |       |     |       |     |
      //  .   +-----+       +-----+       +-----+
      //  .
      //  4
      //  .
      //  .   +-----+       +-----+       +-----+
      //  .   |     |       |     |       |     |
      //  -   +-----+       +-----+       +-----+
      //
      //      |. . . . . . . . 10. . . . . . . .|

      const grid = new Grid([1, 2, 3, 4, 5, 6]);
      grid.itemAspectRatio = 2;
      grid.cellMargin = 1;
      grid.verticalFacet = (item: number) => item % 2;
      grid.horizontalFacet = (item: number) => item % 3;

      grid.facetItemsIntoCells();

      expect(grid.verticalKeys.length).to.equal(2);
      expect(grid.horizontalKeys.length).to.equal(3);
      expect(grid.longestCellLength).to.equal(1);

      expect(grid.computeGridAspectRatio(1)).to.be.closeTo(10 / 4, 1e-9);
    });

    it('should give 10/6: 2x3 grid, 12 items, item ratio 2, margin 1', () => {
      //  -   +-----+       +-----+       +-----+
      //  .   |     |       |     |       |     |
      //  .   +-----+       +-----+       +-----+
      //  .   |     |       |     |       |     |
      //  .   +-----+       +-----+       +-----+
      //  .
      //  6
      //  .
      //  .   +-----+       +-----+       +-----+
      //  .   |     |       |     |       |     |
      //  .   +-----+       +-----+       +-----+
      //  .   |     |       |     |       |     |
      //  -   +-----+       +-----+       +-----+
      //
      //      |. . . . . . . . 10. . . . . . . .|

      const grid = new Grid([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      grid.itemAspectRatio = 2;
      grid.cellMargin = 1;
      grid.verticalFacet = (item: number) => item % 2;
      grid.horizontalFacet = (item: number) => item % 3;

      grid.facetItemsIntoCells();

      expect(grid.verticalKeys.length).to.equal(2);
      expect(grid.horizontalKeys.length).to.equal(3);
      expect(grid.longestCellLength).to.equal(2);

      expect(grid.computeGridAspectRatio(1)).to.be.closeTo(10 / 6, 1e-9);
    });

  });

  describe('computeOptimalCellAspectRatio', () => {

    it('should give 1 for a 1x1 grid of 1 item for target of 1', () => {
      //  - +---+
      //  1 |   |
      //  - +---+
      //    |.1.|

      const grid = new Grid([10]);

      grid.facetItemsIntoCells();

      expect(grid.computeOptimalCellAspectRatio(1)).to.equal(1);
    });

    it('should give 2 for a 1x1 grid of 7 items for target of 2', () => {
      //  - +---+---+---+
      //  . |   |   |   |          - +-------+
      //  2 +---+---+---+---+  =>  1 |       |  =>  2/1
      //  . |   |   |   |   |      - +-------+
      //  - +---+---+---+---+        |. .2. .|
      //    |. . . .4. . . .|

      const grid = new Grid([1, 2, 3, 4, 5, 6, 7]);

      grid.facetItemsIntoCells();

      expect(grid.computeOptimalCellAspectRatio(2)).to.equal(2);
    });

    it('should give 1/2: 2x3 grid, 200 items/cell, target of 3/4', () => {
      //  - +---++---++---+
      //  . |20 ||20 ||20 |
      //  . | x || x || x |      - +---+
      //  . | 10|| 10|| 10|      . |   |
      //  4 +===++===++===+  =>  2 |   |  =>  1/2
      //  . |20 ||20 ||20 |      . |   |
      //  . | x || x || x |      - +---+
      //  . | 10|| 10|| 10|        |.1.|
      //  - +---++---++---+
      //    |. . . 3 . . .|

      const numRows = 2;
      const numColumns = 3;
      const itemsPerCell = 200;
      const totalItems = numRows * numColumns * itemsPerCell;

      const items: number[] = [];
      for (let i = 0; i < totalItems; i++) {
        items.push(i);
      }

      const grid = new Grid(items);
      grid.cellMargin = 0;
      grid.verticalFacet = (item: number) => item % numRows;
      grid.horizontalFacet = (item: number) => item % numColumns;

      grid.facetItemsIntoCells();

      expect(grid.verticalKeys.length).to.equal(numRows);
      expect(grid.horizontalKeys.length).to.equal(numColumns);
      expect(grid.longestCellLength).to.equal(itemsPerCell);

      expect(grid.computeOptimalCellAspectRatio(3 / 4))
          .to.be.closeTo(1 / 2, 0.001);
    });

  });
});
