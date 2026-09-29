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

The 0.9.19 development build adds native Canvas link-node insertion for web,
Obsidian, and mailto URLs.

The 0.9.20 development build adds contextual editing for a link node's address
and display title.

The 0.9.21 patch enables the documented Canvas shortcuts for mind-map layout
and format copy/paste while leaving text-editor shortcuts untouched.

The 0.9.22 development build adds standalone native text-card and sticky-note
creation, entering edit mode immediately after insertion.

The 0.9.23 development build lets the shape menu create a new native flowchart
shape when nothing is selected, while preserving selected-node shape editing.

The 0.9.24 development build adds direct edge creation from two selected nodes
with geometry-aware anchors and duplicate-edge protection.

The 0.9.25 patch fixes the component library filter so built-in components are
shown together with saved components.

The 0.9.26 patch unifies built-in and saved-component categorization and search
in the actual modal renderer.

The 0.9.27 patch resolves drag targets by the Canvas wrapper under the pointer,
so component drops work correctly in split-view canvases.

The 0.9.28 development build adds node opacity controls to the contextual
inspector.

The 0.9.29 development build extends Canvas search and replace to group and
swimlane titles.

The 0.9.30 development build extends search and replace to link-node URLs while
preserving their display titles.

The 0.9.31 development build adds selection zoom and fit-to-view navigation
through Advanced Canvas.

The 0.9.32 development build adds previous/next presentation navigation and an
explicit end-presentation command.

The 0.9.33 development build adds native selection duplication with internal
edge remapping and a `Ctrl/Cmd+D` shortcut.

The 0.9.34 development build adds validated Vault-path editing for selected
file nodes.

The 0.9.35 development build adds a live selection-context label to the toolbar
for canvas, node, edge, and mixed selections.

The 0.9.36 development build makes the toolbar context-aware: low-relevance
actions are hidden from the primary row but remain available in “更多”.

The 0.9.37 development build adds selection deletion with automatic cleanup of
edges connected to deleted nodes.

The 0.9.38 development build adds a persistent canvas grid toggle stored in
optional Canvas Studio metadata.

The 0.9.39 development build adds four local canvas background presets in the
empty-selection inspector.

The 0.9.40 development build adds a basic local freehand layer stored in Canvas
Studio metadata, with an explicit clear-strokes action.

The 0.9.41 patch adds a localStorage fallback for component identity during
cross-window drag operations.

The 0.9.42 patch adds toolbar and command-palette entries for undo and redo,
delegating to Obsidian's native editor commands.

The 0.9.43 patch improves two editing paths:

- manual edge waypoint previews use an orthogonal A* grid to route around
  multiple blocking nodes;
- selected text ranges can be recovered from CodeMirror or the native DOM
  selection before applying font styles from the toolbar.

The 0.9.44 patch also shows the same temporary obstacle-avoiding preview for
edges explicitly set to the `自动避障` route, even before a manual waypoint is
added.

The 0.9.45 patch adds both column-oriented and row-oriented swimlane templates
using native groups, text nodes, and edges.

The 0.9.46 patch adds a swimlane-direction selector to the contextual inspector,
reflowing selected lanes and moving their contained nodes together.

The 0.9.47 patch adds explicit mixed-selection adoption: selected nodes can be
moved into the selected swimlane while keeping their relative arrangement.

The 0.9.48 patch adds node rotation, horizontal/vertical flipping, and layer
ordering controls in the contextual inspector.

The 0.9.49 patch adds a persistent mind-map root marker. Layout uses that root
when no node is selected, while retaining native Canvas nodes and edges.

The 0.9.50 patch adds an empty-swimlane action to the contextual inspector,
placing a new lane on the right for column layouts or below for row layouts.

The 0.9.51 patch adds an explicit confirmed delete action for a swimlane and
its contained nodes/edges, while keeping container removal content-preserving.

The 0.9.52 patch records optional `canvasStudioLaneId` membership on nodes
moved into or copied with a swimlane.

The 0.9.53 patch adds a direct swimlane-membership selector for selected nodes,
so reassignment does not require selecting the target group at the same time.

The 0.9.54 patch adds a live target highlight during node movement and keeps
the persisted lane membership in sync when a node enters or leaves a lane.

The 0.9.55 patch adds a Chinese target-lane notice and a subtle pulse animation
to make the drop destination easier to scan.

The 0.9.56 patch adds depth-aware mind-map themes for root and branch levels,
using only native node styles and optional Canvas Studio metadata.

The 0.9.57 patch adds persistent mind-map branch collapse/expand. Descendant
nodes and their runtime edges are hidden or restored without changing Canvas
node types.

The 0.9.58 patch aligns the development status documents with the current
0.9.x implementation and verification scope.

The 0.9.59 documentation check records that the running Obsidian CLI exposes no
PDF/print/export command; Canvas Studio therefore continues to claim PNG/SVG
only until a dedicated PDF implementation exists.

The 0.9.60 documentation check records a real Obsidian CLI Canvas smoke gate:
the row-oriented swimlane command wrote native `group`/`text`/`edge` data to an
isolated Canvas and the temporary file was then removed.

The 0.9.61 documentation check also verified the decision-branch template at
runtime: six native text nodes, six edges, five flowchart shapes, and `是`/`否`
edge labels were written to an isolated Canvas.

The 0.9.62 patch exposes explicit `开始` and `结束` flowchart entries while
retaining the native pill shape and recording an optional flow role.

The 0.9.63 patch adds top/middle/bottom vertical text alignment in the node
inspector using optional `styleAttributes.verticalAlign`.

The 0.9.64 patch fixes native edge arrow persistence and adds a start-arrow
selector for bidirectional flowchart connections.

The 0.9.65 patch applies the same optional start/end flow roles to generated
basic-process and decision-branch templates.

The 0.9.66 patch adds flow-role readback and editing for pill-shaped nodes in
the contextual inspector.

The 0.9.67 patch clears stale custom arrow styling when switching an edge back
to native triangle or no-arrow endpoints.

The 0.9.68 patch adds a persistent canvas-mode selector for free whiteboard,
mind-map, and flowchart workflows.

The 0.9.69 documentation update aligns the published test-count evidence with
the current 101-test suite.

The 0.9.70 patch surfaces the persisted canvas mode in the toolbar context
label for faster scanning while working.

The 0.9.71 patch links common actions to the mode state: mind-map operations
select mind-map mode, while shapes, edges, and flow templates select flowchart
mode.

## Data policy

Canvas Studio keeps standard JSON Canvas node types and stores optional visual
properties in `styleAttributes`. It does not create a second content file.
This is a local single-user whiteboard plugin; multiplayer editing,
collaboration cursors, comments, mentions, and realtime synchronization are
intentionally out of scope.
