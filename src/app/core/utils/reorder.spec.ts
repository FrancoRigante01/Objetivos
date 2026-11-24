import { moveItem } from './reorder';

describe('moveItem', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('mueve un elemento hacia abajo y lo coloca en la posición del destino', () => {
    expect(moveItem(items, 'a', 'c').map(item => item.id)).toEqual(['b', 'c', 'a']);
  });

  it('mueve un elemento hacia arriba y lo coloca en la posición del destino', () => {
    expect(moveItem(items, 'c', 'a').map(item => item.id)).toEqual(['c', 'a', 'b']);
  });

  it('no altera la lista si el origen y el destino son el mismo', () => {
    expect(moveItem(items, 'b', 'b')).toBe(items);
  });

  it('no altera la lista si alguno de los ids no existe', () => {
    expect(moveItem(items, 'x', 'a')).toBe(items);
    expect(moveItem(items, 'a', 'x')).toBe(items);
  });
});
