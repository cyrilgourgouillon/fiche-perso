import { serializeSheet, sheetFileName } from './sheetSerializer';

const JSON_MIME_TYPE = 'application/json;charset=utf-8';

export const readFileAsText = (file: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsText(file);
});

/** Triggers a browser download of the sheet and returns the file name used. */
export const downloadSheet = (data) => {
  const fileName = sheetFileName(data);
  const url = URL.createObjectURL(new Blob([serializeSheet(data, { timestamp: true })], { type: JSON_MIME_TYPE }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // some browsers start the download asynchronously: revoking at once can cancel it
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return fileName;
};
