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

The 0.9.6 development build adds drag-and-drop insertion from the component
library. The drop point follows the current Canvas viewport scale and creates
the same native nodes as click insertion.

The 0.9.7 patch keeps the drag interaction active through the component modal
overlay and shows a pointer-following placement preview.

The 0.9.8 development build adds container snapping for moved nodes and
component drops, keeping resulting native nodes inside a group or lane.

The 0.9.9 development build adds basic manual edge waypoints. Select one edge,
add a waypoint from the inspector, then drag a handle to reshape the local
route; double-click a handle to remove it. Waypoints remain optional Canvas
extension data and clearing them restores the Advanced Canvas route.

The 0.9.10 development build adds a preview-only obstacle detour layer for
manual routes. Detour points are recalculated from current node geometry and
are never persisted as user waypoints.

The 0.9.11 development build adds native group collapse and expand controls,
delegating to Advanced Canvas when available.

The 0.9.12 development build adds direct group and swimlane title editing in
the contextual inspector.

The 0.9.13 development build adds group and swimlane width/height controls in
the same inspector, with minimum dimensions and batch editing support.

The 0.9.14 development build adds right/below lane duplication. Internal nodes
and edges are copied with fresh IDs while external edges remain untouched.

The 0.9.15 development build adds left/right lane reordering and confirmed
container removal that preserves the lane contents.

The 0.9.16 development build adds horizontal and vertical batch lane arranging
for multi-selected groups.

The 0.9.17 patch fixes built-in component visibility in the component library
and adds component search with an empty-state message.

The 0.9.18 patch labels the export menu with the PNG/SVG formats exposed by
Advanced Canvas; PDF export is not claimed until a dedicated implementation is
available.

## Data policy

Canvas Studio keeps standard JSON Canvas node types and stores optional visual
properties in `styleAttributes`. It does not create a second content file.
