import { lessonIndex, lessonRoute } from './routing';

describe('ordinary lesson positions', () => {
  it.each([
    ['stars/watch/3', 'stars', 2],
    ['mine/p1/watch/4', 'mine/p1', 3],
    ['stars/watch', 'stars', 'beginning'],
    ['stars/repeat', 'stars', 'repeat'],
    ['stars/result', 'stars', 'result'],
    ['stars', 'stars', 'result'],
  ])('reads %s', (route, id, position) => {
    expect(lessonRoute(String(route))).toEqual({ id, position });
  });
  it.each([
    'stars/watch/0',
    'stars/watch/-1',
    'stars/watch/NaN',
    'stars/watch/9007199254740992',
  ])('does not treat malformed %s as a valid lesson', (route) => {
    expect(lessonRoute(route).id).toBe(route);
  });
  it('preserves the alternate teaching order', () => {
    expect(lessonRoute('stars/watch/8?order=color')).toEqual({
      id: 'stars',
      position: 7,
      colourFirst: true,
    });
  });
  it('bounds positions to the available stages', () => {
    expect(lessonIndex(999, 9)).toBe(8);
    expect(lessonIndex('beginning', 9)).toBe(0);
    expect(lessonIndex('repeat', 9)).toBe(7);
    expect(lessonIndex('result', 9)).toBe(8);
  });
});
