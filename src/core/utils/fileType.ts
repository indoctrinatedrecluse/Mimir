export type DownloadFileType = 'document' | 'image' | 'archive' | 'video' | 'audio' | 'other';

export const detectFileType = (filename: string): DownloadFileType => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return 'image';
  if (['zip', 'tar', 'gz', '7z', 'rar', 'bz2', 'xz'].includes(ext)) return 'archive';
  if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
  if (['mp3', 'flac', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
  if (['pdf', 'txt', 'md', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'json', 'xml'].includes(ext)) return 'document';
  return 'other';
};
