# Canvas Studio

Canvas Studio extends Obsidian's native `.canvas` files with mind-map creation,
flowchart shapes, typography, layout, format-copying tools, Markdown outline
import, and local flowchart templates.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```

The plugin expects Obsidian 1.13 or newer. Advanced Canvas 7.0.1 or newer is
recommended for flowchart shapes and edge routing.

The 0.2.x development build adds two local-only workflows:

- paste Markdown headings/lists into a bounded Canvas tree;
- insert declarative basic-process or decision-branch templates.

The 0.3.x development build adds local Canvas text search and replacement:

- case-sensitive or case-insensitive matching;
- click a result to select and zoom to its node;
- replace the current match or replace all matches in one undoable transaction.

The 0.4.x development build adds:

- a declarative cross-team swimlane template stored as native groups, text nodes,
  and edges;
- three semantic node/edge themes for whole canvases or current selections;
- a unified image-export menu backed by Advanced Canvas;
- mobile toolbar scrolling, safe-area placement, and 44px touch targets.

The 0.5.x development build unifies Advanced Canvas presentation mode,
readonly mode, image export, and canvas capability information under the Canvas
Studio toolbar and command palette.

The 0.6.x development build adds a read-only Canvas integrity checker for
duplicate IDs, invalid edge references, cycles, overlapping nodes, and group
overflow.

The 0.7.x development build adds compact Chinese toolbar labels, keeps selection
dependent menus available with Chinese guidance, and adds selected/all edge
alignment with geometry-aware cardinal anchors and square routing.

## Data policy

Canvas Studio keeps standard JSON Canvas node types and stores optional visual
properties in `styleAttributes`. It does not create a second content file.
