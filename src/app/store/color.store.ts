import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import chroma from 'chroma-js';
import { generatePalette } from '../utils/color-generator';

export interface ColorItem {
  id: string;
  hex: string;
  locked: boolean;
}

export interface SavedPalette {
  id: string;
  name: string;
  description: string;
  tags: string[];
  colors: string[];
  timestamp: number;
}

const initialState: {
  colors: ColorItem[];
  activeShadesPanelId: string | null;
  isSaveDialogOpen: boolean;
  history: ColorItem[][];
  future: ColorItem[][];
} = {
  colors: [],
  activeShadesPanelId: null,
  isSaveDialogOpen: false,
  history: [],
  future: [],
};

export const ColorStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const pushHistory = () => {
      const current = store.colors();
      if (current.length === 0) return; // Don't save empty state

      const history = [...store.history(), JSON.parse(JSON.stringify(current))];
      if (history.length > 5) history.shift();

      patchState(store, { history, future: [] });
    };

    return {
      generateColors(): void {
        if (store.activeShadesPanelId()) return;

        pushHistory();
        const current = store.colors();
        const palette = generatePalette(current);

        if (current.length === 0) {
          patchState(store, {
            colors: palette.map((hex) => ({
              id: crypto.randomUUID(),
              hex,
              locked: false,
            })),
          });
        } else {
          patchState(store, {
            colors: current.map((c, i) =>
              c.locked ? c : { ...c, hex: palette[i] },
            ),
          });
        }
      },

      toggleLock(id: string): void {
        if (store.activeShadesPanelId()) return;
        pushHistory();

        patchState(store, {
          colors: store
            .colors()
            .map((c) => (c.id === id ? { ...c, locked: !c.locked } : c)),
        });
      },

      updateColor(id: string, hex: string): void {
        pushHistory();
        patchState(store, {
          colors: store.colors().map((c) => (c.id === id ? { ...c, hex } : c)),
        });
      },

      undo(): void {
        const history = [...store.history()];
        const current = store.colors();
        if (history.length === 0) return;

        const previous = history.pop();
        if (!previous) return;

        const future = [JSON.parse(JSON.stringify(current)), ...store.future()];
        if (future.length > 5) future.pop();

        patchState(store, {
          colors: previous,
          history,
          future,
        });
      },

      redo(): void {
        const future = [...store.future()];
        const current = store.colors();
        if (future.length === 0) return;

        const next = future.shift();
        if (!next) return;

        const history = [
          ...store.history(),
          JSON.parse(JSON.stringify(current)),
        ];
        if (history.length > 5) history.shift();

        patchState(store, {
          colors: next,
          history,
          future,
        });
      },

      setActiveShadesPanel(id: string | null): void {
        patchState(store, { activeShadesPanelId: id });
      },

      removeColor(id: string): void {
        if (store.activeShadesPanelId()) return;
        const current = store.colors();
        if (current.length <= 2) return;

        pushHistory();
        patchState(store, {
          colors: store.colors().filter((c) => c.id !== id),
        });
      },

      insertColor(index: number): void {
        if (store.activeShadesPanelId()) return;

        const current = store.colors();
        if (current.length >= 8) return;

        const c1 = current[index];
        const c2 = current[index + 1];
        if (!c1 || !c2) return;

        pushHistory();
        const mixedHex = chroma.mix(c1.hex, c2.hex, 0.5, 'lab').hex();
        const newItem: ColorItem = {
          id: crypto.randomUUID(),
          hex: mixedHex,
          locked: false,
        };

        const newColors = [
          ...current.slice(0, index + 1),
          newItem,
          ...current.slice(index + 1),
        ];
        patchState(store, { colors: newColors });
      },

      setSaveDialogOpen(open: boolean): void {
        patchState(store, { isSaveDialogOpen: open });
      },

      savePalette(metadata: {
        name: string;
        description: string;
        tags: string[];
      }): void {
        const currentPalettesJson = localStorage.getItem('saved_palettes');
        const palettes: SavedPalette[] = currentPalettesJson
          ? JSON.parse(currentPalettesJson)
          : [];

        const newPalette: SavedPalette = {
          id: crypto.randomUUID(),
          ...metadata,
          colors: store.colors().map((c) => c.hex),
          timestamp: Date.now(),
        };

        localStorage.setItem(
          'saved_palettes',
          JSON.stringify([newPalette, ...palettes]),
        );
        patchState(store, { isSaveDialogOpen: false });
      },

      reorderColors(
        fromIndex: number,
        toIndex: number,
        skipHistory = false,
      ): void {
        if (fromIndex === toIndex) return;
        if (!skipHistory) {
          pushHistory();
        }

        const colors = [...store.colors()];
        const [movedItem] = colors.splice(fromIndex, 1);
        colors.splice(toIndex, 0, movedItem);

        patchState(store, { colors });
      },
    };
  }),
);
