import assert from 'node:assert/strict';
import test from 'node:test';
import { hasWritePermission, readFile, writeFile } from './linkedFile';

test('should query or request read-write permission when the corresponding method is selected', async () => {
  const calls = [];
  const handle = {
    queryPermission: async (options) => {
      calls.push(['query', options]);
      return 'granted';
    },
    requestPermission: async (options) => {
      calls.push(['request', options]);
      return 'denied';
    },
  };

  assert.equal(await hasWritePermission(handle), true);
  assert.equal(await hasWritePermission(handle, true), false);
  assert.deepEqual(calls, [
    ['query', { mode: 'readwrite' }],
    ['request', { mode: 'readwrite' }],
  ]);
});

test('should reject permission checks when the selected permission method is unavailable', async () => {
  await assert.rejects(hasWritePermission({}), /Vérification des permissions indisponible/);
  await assert.rejects(
    hasWritePermission({ queryPermission: async () => 'granted' }, true),
    /Vérification des permissions indisponible/,
  );
});

test('should return file text and modification time when a linked file is read', async () => {
  const handle = {
    getFile: async () => ({
      lastModified: 1234,
      text: async () => '{"character":{"name":"Kresk"}}',
    }),
  };

  assert.deepEqual(await readFile(handle), {
    text: '{"character":{"name":"Kresk"}}',
    modifiedAt: 1234,
  });
});

test('should write and close a file when writing succeeds', async () => {
  const calls = [];
  const handle = {
    createWritable: async () => ({
      write: async (text) => calls.push(['write', text]),
      close: async () => calls.push(['close']),
      abort: async () => calls.push(['abort']),
    }),
  };

  await writeFile(handle, '{"ok":true}');
  assert.deepEqual(calls, [['write', '{"ok":true}'], ['close']]);
});

test('should abort and rethrow the original error when writing a file fails', async () => {
  const writeError = new Error('disk full');
  const calls = [];
  const handle = {
    createWritable: async () => ({
      write: async () => {
        calls.push('write');
        throw writeError;
      },
      close: async () => calls.push('close'),
      abort: async () => calls.push('abort'),
    }),
  };

  await assert.rejects(writeFile(handle, 'sheet data'), (error) => error === writeError);
  assert.deepEqual(calls, ['write', 'abort']);
});
