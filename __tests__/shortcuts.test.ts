import { jest } from '@jest/globals';
import { EditorView } from 'prosemirror-view';
import { applyGlobalKeyBindings } from '../src/ProofFlow/commands/shortcuts';
import { Minimap } from '../src/ProofFlow/minimap';
import { undo, redo, selectParentNode, getCollapsibleInsertCommand, getInputInsertCommand, proofFlow, UserMode } from '../src/ProofFlow/commands/commands.ts';

jest.mock('prosemirror-view', () => {
    return {
      EditorView: jest.fn().mockImplementation(() => {
        return {
          state: {},
          dispatch: jest.fn(),
          // Mock any methods you need
          someMethod: jest.fn(),
        };
      })
    };
  });
  

jest.mock('./commands', () => ({
  undo: jest.fn(),
  redo: jest.fn(),
  selectParentNode: jest.fn(),
  getCollapsibleInsertCommand: jest.fn(),
  getInputInsertCommand: jest.fn(),
  proofFlow: { getUserMode: jest.fn() },
}));

describe('applyGlobalKeyBindings', () => {
  let cleanupFunction;
  let editorViewMock;
  let minimapMock;

  beforeEach(() => {
    editorViewMock = new EditorView({} as any, {} as any);
    minimapMock = new Minimap();
    cleanupFunction = applyGlobalKeyBindings(editorViewMock);
  });

  afterEach(() => {
    cleanupFunction();
  });

  it('should call undo on "Ctrl + Z"', () => {
    const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
    document.dispatchEvent(event);
    expect(undo).toHaveBeenCalled();
  });

  it('should call redo on "Ctrl + Y"', () => {
    const event = new KeyboardEvent('keydown', { key: 'y', ctrlKey: true });
    document.dispatchEvent(event);
    expect(redo).toHaveBeenCalled();
  });

  it('should call selectParentNode on "Ctrl + P"', () => {
    const event = new KeyboardEvent('keydown', { key: 'p', ctrlKey: true });
    document.dispatchEvent(event);
    expect(selectParentNode).toHaveBeenCalled();
  });

  it('should call getCollapsibleInsertCommand on "Ctrl + B"', () => {
    const event = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true });
    document.dispatchEvent(event);
    expect(getCollapsibleInsertCommand).toHaveBeenCalled();
  });

  it('should call getInputInsertCommand on "Ctrl + I" for teacher mode', () => {
    proofFlow.getUserMode.mockReturnValue(UserMode.Teacher);
    const event = new KeyboardEvent('keydown', { key: 'i', ctrlKey: true });
    document.dispatchEvent(event);
    expect(getInputInsertCommand).toHaveBeenCalled();
  });

  it('should not call getInputInsertCommand on "Ctrl + I" for non-teacher mode', () => {
    proofFlow.getUserMode.mockReturnValue(UserMode.Student); // Assuming there's a Student mode
    const event = new KeyboardEvent('keydown', { key: 'i', ctrlKey: true });
    document.dispatchEvent(event);
    expect(getInputInsertCommand).not.toHaveBeenCalled();
  });

  it('should call minimap.switch on "Ctrl + H"', () => {
    const event = new KeyboardEvent('keydown', { key: 'h', ctrlKey: true });
    document.dispatchEvent(event);
    expect(minimapMock.switch).toHaveBeenCalled();
  });
});