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

The 0.7.1 patch preserves text selections before toolbar focus changes and
applies typography to the selected text range instead of the entire card.

The 0.8.x development build adds a contextual property inspector: canvas state
when nothing is selected, node properties for selected nodes, and routing
properties for selected edges.

It also adds smart snapping to a configurable grid and nearby node guides when
nodes are moved.

The 0.9.x development build adds a local component library for reusable
buttons, input fields, tags, information cards, and alert cards. Components are
inserted as native Canvas nodes; no component content sidecar is created.

The 0.9.1 patch keeps nodes inside a group or swimlane moving with their parent,
matching the expected container behavior of a whiteboard editor.

The 0.9.2 development build adds local saved components: select nodes, save a
named component, and insert fresh copies from the `我的组件` library category.

The 0.9.3 development build adds a native editable table component and a local
Vault media library. Search and filter images, SVGs, PDFs, and common files,
then insert the selected asset as a standard Canvas `file` node. Image assets
show a thumbnail preview; no content sidecar file is created.

The 0.9.4 development build adds group and swimlane auto-fit: select a group
and use the inspector action to resize it to the bounds of its contained nodes
without moving those nodes.

The same release groups low-frequency commands under a Chinese-labeled “更多”
menu and keeps write actions unavailable while a Canvas is read-only.

The 0.9.5 development build adds native grouping and ungrouping from the
arrangement menu. Grouping preserves selected node geometry and internal edges;
ungrouping removes only the container.

## Data policy

Canvas Studio keeps standard JSON Canvas node types and stores optional visual
properties in `styleAttributes`. It does not create a second content file.
