import { parseSseBuffer } from './stream-parser';

describe('parseSseBuffer', () => {
  it('parses data lines and keeps partial buffer', () => {
    const result = parseSseBuffer('data: {"type":"chunk","data":"a"}\nignored\ndata: {bad}\ndata: {"type":"done","data":"ab"}');
    expect(result.events).toEqual([{ type: 'chunk', data: 'a' }]);
    expect(result.remainingBuffer).toBe('data: {"type":"done","data":"ab"}');
  });
});
