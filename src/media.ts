export type MediaKind = 'image' | 'vector' | 'pdf' | 'file';

export interface MediaItem {
  path: string;
  name: string;
  kind: MediaKind;
  extension: string;
}

const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'tif', 'tiff', 'ico', 'heic', 'heif']);
const vectorExtensions = new Set(['svg']);
const fileExtensions = new Set([
  'mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v',
  'mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac',
  'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv',
  'txt', 'md', 'json', 'yaml', 'yml', 'xml', 'html', 'css', 'js', 'ts',
  'zip', '7z', 'tar', 'gz', 'epub'
]);

export function classifyMediaPath(path: string): MediaKind | null {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  if (imageExtensions.has(extension)) return 'image';
  if (vectorExtensions.has(extension)) return 'vector';
  if (extension === 'pdf') return 'pdf';
  if (fileExtensions.has(extension)) return 'file';
  return null;
}

export function mediaItemsFromPaths(paths: string[]): MediaItem[] {
  return paths.flatMap((path) => {
    const kind = classifyMediaPath(path);
    if (!kind) return [];
    const name = path.split('/').pop() ?? path;
    const extension = path.split('.').pop()?.toLowerCase() ?? '';
    return [{ path, name, kind, extension }];
  }).sort((left, right) => left.name.localeCompare(right.name));
}

export function filterMediaItems(items: MediaItem[], query: string, kind: MediaKind | 'all' = 'all'): MediaItem[] {
  const normalized = query.trim().toLocaleLowerCase();
  return items.filter((item) => (kind === 'all' || item.kind === kind)
    && (!normalized || item.name.toLocaleLowerCase().includes(normalized) || item.path.toLocaleLowerCase().includes(normalized)));
}
