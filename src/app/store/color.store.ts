import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import chroma from 'chroma-js';
import { inject, DestroyRef } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { generatePalette } from '../utils/color-generator';
import { APP_CONFIG } from '../config/app.config';

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
  isExportDialogOpen: boolean;
  enforceAccessibility: boolean;
  editingPalette: SavedPalette | null;
  history: ColorItem[][];
  future: ColorItem[][];
} = {
  colors: [],
  activeShadesPanelId: null,
  isSaveDialogOpen: false,
  isExportDialogOpen: false,
  enforceAccessibility: false,
  editingPalette: null,
  history: [],
  future: [],
};

export const ColorStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const messageService = inject(MessageService);
    const router = inject(Router);
    const route = inject(ActivatedRoute);

    const getHexCodesFromColors = (colors: ColorItem[]) =>
      colors.map((c) => c.hex.replace('#', '')).join('-');

    const updateUrl = (colors: ColorItem[]) => {
      // Only update URL if we are on the generator page
      if (!router.url.includes('/generator')) return;

      const hexList = getHexCodesFromColors(colors);
      const urlTree = router.parseUrl(router.url);
      const currentParams = urlTree.queryParams['colors'];

      if (hexList !== currentParams) {
        urlTree.queryParams['colors'] = hexList;
        router.navigateByUrl(urlTree, {
          replaceUrl: false,
        });
      }
    };

    const pushHistory = () => {
      const current = store.colors();
      if (current.length === 0) return;

      const history = [...store.history(), JSON.parse(JSON.stringify(current))];
      if (history.length > APP_CONFIG.history.maxSize) history.shift();

      patchState(store, { history, future: [] });
    };

    return {
      syncFromUrl(colorsParam: string | null): void {
        if (!colorsParam) {
          if (store.colors().length === 0) {
            this.generateColors();
          }
          return;
        }

        const currentHexList = getHexCodesFromColors(store.colors());
        if (colorsParam === currentHexList) return;

        const hexCodes = colorsParam.split('-');
        const colorItems: ColorItem[] = hexCodes
          .filter((hex) => /^([0-9A-F]{3}){1,2}$/i.test(hex))
          .map((hex) => ({
            id: crypto.randomUUID(),
            hex: `#${hex}`,
            locked: false,
          }));

        if (colorItems.length >= APP_CONFIG.colors.minCount) {
          patchState(store, { colors: colorItems });
        } else if (store.colors().length === 0) {
          this.generateColors();
        }
      },

      syncUrl(): void {
        updateUrl(store.colors());
      },

      generateColors(): void {
        if (store.activeShadesPanelId()) return;

        pushHistory();
        const current = store.colors();
        const palette = generatePalette(current, {
          enforceAccessibility: store.enforceAccessibility(),
        });
        let newColors: ColorItem[] = [];

        if (current.length === 0) {
          newColors = palette.map((hex) => ({
            id: crypto.randomUUID(),
            hex,
            locked: false,
          }));
        } else {
          newColors = current.map((c, i) =>
            c.locked ? c : { ...c, hex: palette[i] },
          );
        }

        patchState(store, { colors: newColors });
        updateUrl(newColors);
      },

      toggleLock(id: string): void {
        if (store.activeShadesPanelId()) return;
        pushHistory();

        const newColors = store
          .colors()
          .map((c) => (c.id === id ? { ...c, locked: !c.locked } : c));

        patchState(store, { colors: newColors });
        updateUrl(newColors);
      },

      updateColor(id: string, hex: string): void {
        pushHistory();
        const newColors = store
          .colors()
          .map((c) => (c.id === id ? { ...c, hex } : c));
        patchState(store, { colors: newColors });
        updateUrl(newColors);
      },

      undo(): void {
        const history = [...store.history()];
        const current = store.colors();
        if (history.length === 0) return;

        const previous = history.pop();
        if (!previous) return;

        const future = [JSON.parse(JSON.stringify(current)), ...store.future()];
        if (future.length > APP_CONFIG.history.maxSize) future.pop();

        patchState(store, {
          colors: previous,
          history,
          future,
        });
        updateUrl(previous);

        messageService.add({
          severity: 'secondary',
          summary: 'Palette restored',
          life: APP_CONFIG.toast.life,
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
        if (history.length > APP_CONFIG.history.maxSize) history.shift();

        patchState(store, {
          colors: next,
          history,
          future,
        });
        updateUrl(next);

        messageService.add({
          severity: 'secondary',
          summary: 'Next palette applied',
          life: APP_CONFIG.toast.life,
        });
      },

      setActiveShadesPanel(id: string | null): void {
        patchState(store, { activeShadesPanelId: id });
      },

      removeColor(id: string): void {
        if (store.activeShadesPanelId()) return;
        const current = store.colors();
        if (current.length <= APP_CONFIG.colors.minCount) return;

        pushHistory();
        const newColors = store.colors().filter((c) => c.id !== id);
        patchState(store, { colors: newColors });
        updateUrl(newColors);
      },

      insertColor(index: number): void {
        if (store.activeShadesPanelId()) return;

        const current = store.colors();
        if (current.length >= APP_CONFIG.colors.maxCount) return;

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
        updateUrl(newColors);
      },

      setExportDialogOpen(open: boolean): void {
        patchState(store, { isExportDialogOpen: open });
      },

      setSaveDialogOpen(open: boolean, palette?: SavedPalette): void {
        patchState(store, {
          isSaveDialogOpen: open,
          editingPalette: open ? palette || null : null,
        });
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
        patchState(store, { isSaveDialogOpen: false, editingPalette: null });
      },

      updatePalette(
        id: string,
        metadata: {
          name: string;
          description: string;
          tags: string[];
        },
      ): void {
        const currentPalettesJson = localStorage.getItem('saved_palettes');
        const palettes: SavedPalette[] = JSON.parse(currentPalettesJson);
        const index = palettes.findIndex((p) => p.id === id);

        if (index !== -1) {
          palettes[index] = {
            ...palettes[index],
            ...metadata,
          };

          localStorage.setItem('saved_palettes', JSON.stringify(palettes));
        }

        patchState(store, { isSaveDialogOpen: false, editingPalette: null });
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
        updateUrl(colors);
      },

      toggleAccessibility(): void {
        patchState(store, {
          enforceAccessibility: !store.enforceAccessibility(),
        });

        // Regenerate current colors if enforcement is turned ON
        if (store.enforceAccessibility()) {
          this.generateColors();
          messageService.add({
            severity: 'success',
            summary: 'Accessible Mode ON',
            life: APP_CONFIG.toast.life,
          });
        } else {
          messageService.add({
            severity: 'secondary',
            summary: 'Accessible Mode OFF',
            life: APP_CONFIG.toast.life,
          });
        }
      },
    };
  }),
  withHooks({
    onInit(store) {
      const route = inject(ActivatedRoute);
      const destroyRef = inject(DestroyRef);

      route.queryParamMap
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe((params) => {
          store.syncFromUrl(params.get('colors'));
        });
    },
  }),
);
