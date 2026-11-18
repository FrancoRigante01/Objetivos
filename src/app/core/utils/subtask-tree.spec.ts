import { Subtask } from '../models/goal.model';
import { addSubtaskToTree, removeSubtaskFromTree, updateSubtaskInTree } from './subtask-tree';

function node(id: string, subtasks: Subtask[] = []): Subtask {
  return { id, title: id, done: false, subtasks };
}

describe('subtask-tree', () => {
  it('añade una subtarea en la raíz cuando no hay padre', () => {
    const tree = addSubtaskToTree([node('a')], node('b'), null);
    expect(tree.map(item => item.id)).toEqual(['a', 'b']);
  });

  it('añade una subtarea dentro de un nodo a cualquier profundidad', () => {
    const tree = [node('a', [node('a1', [node('a1x')])])];
    const updated = addSubtaskToTree(tree, node('nuevo'), 'a1x');
    expect(updated[0].subtasks[0].subtasks[0].subtasks.map(item => item.id)).toEqual(['nuevo']);
  });

  it('actualiza un nodo anidado sin modificar el árbol original', () => {
    const tree = [node('a', [node('a1')])];
    const updated = updateSubtaskInTree(tree, 'a1', item => ({ ...item, done: true }));

    expect(updated[0].subtasks[0].done).toBe(true);
    expect(tree[0].subtasks[0].done).toBe(false);
  });

  it('elimina un nodo anidado junto con sus descendientes', () => {
    const tree = [node('a', [node('a1', [node('a1x')]), node('a2')])];
    const updated = removeSubtaskFromTree(tree, 'a1');

    expect(updated[0].subtasks.map(item => item.id)).toEqual(['a2']);
  });
});
