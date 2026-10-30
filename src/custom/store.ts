// Custom graphics live in this browser's IndexedDB: the picked images never leave the device.

export interface Pick {
  img: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CustomConfig {
  /** Role key → area of an image. */
  picks: Record<string, Pick>;
  /** Character look → its nine frames (null = not picked). */
  chars: Record<string, (Pick | null)[]>;
}

export interface CustomData {
  config: CustomConfig;
  images: Record<string, Blob>;
}

export const emptyData = (): CustomData => ({ config: { picks: {}, chars: {} }, images: {} });

const DB = 'beryl-custom-graphics';
const STORE = 'kv';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadCustom(): Promise<CustomData | null> {
  try {
    const db = await open();
    const data = await new Promise<CustomData | undefined>((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).get('data');
      req.onsuccess = () => resolve(req.result as CustomData | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function saveCustom(data: CustomData): Promise<boolean> {
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(data, 'data');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}

/** Images still used by a pick; unused ones can be dropped. */
export function usedImages(config: CustomConfig): Set<string> {
  const used = new Set<string>();
  for (const p of Object.values(config.picks)) used.add(p.img);
  for (const frames of Object.values(config.chars)) for (const f of frames) if (f) used.add(f.img);
  return used;
}
