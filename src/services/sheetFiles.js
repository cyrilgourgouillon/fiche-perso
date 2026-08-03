import { serializeSheet, sheetFileName } from './sheetSerializer.js';

const JSON_MIME_TYPE = 'application/json;charset=utf-8';

export const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

/** Triggers a browser download of the sheet and returns the file name used. */
export const downloadSheet = (data) => {
  const fileName = sheetFileName(data);
  const url = URL.createObjectURL(new Blob([serializeSheet(data)], { type: JSON_MIME_TYPE }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return fileName;
};
