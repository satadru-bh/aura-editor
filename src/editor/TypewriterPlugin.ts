import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';

export function createTypewriterPlugin(enabled: boolean = false) {
  return ViewPlugin.fromClass(
    class {
      update(update: ViewUpdate) {
        // Only trigger typewriter centering if enabled and user is actively editing text
        if (enabled && update.docChanged) {
          const isUserEdit = update.transactions.some(
            (tr) => tr.isUserEvent('input') || tr.isUserEvent('delete') || tr.isUserEvent('keyboard')
          );
          if (isUserEdit) {
            this.scheduleCenter(update.view);
          }
        }
      }

      scheduleCenter(view: EditorView) {
        view.requestMeasure({
          read(v) {
            const head = v.state.selection.main.head;
            const coords = v.coordsAtPos(head);
            if (!coords) return null;
            const scroller = v.scrollDOM;
            const scrollerRect = scroller.getBoundingClientRect();
            const targetY = scrollerRect.top + scrollerRect.height / 2;
            return coords.top - targetY;
          },
          write(diff, v) {
            if (diff !== null && Math.abs(diff) > 24) {
              v.scrollDOM.scrollTop += diff;
            }
          },
        });
      }
    }
  );
}
