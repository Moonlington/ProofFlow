import { jest } from '@jest/globals';
import { EditorView } from 'prosemirror-view';
import { applyGlobalKeyBindings } from '../src/ProofFlow/commands/shortcuts';
import { EditorState } from 'prosemirror-state';
import { UserMode } from '../src/ProofFlow/UserMode/userMode';
import { proofFlow } from "../src/ProofFlow/commands/helpers.ts";

describe('applyGlobalKeyBindings', () => {

  // Key binding "Ctrl+b" triggers collapsible insert command in Teacher mode
  it('should trigger collapsible insert command when "Ctrl+B" is pressed in Teacher mode', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Teacher);

    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'b' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

  // Key bindings do not trigger actions in Student mode for Teacher-specific commands
  it('should not trigger collapsible insert command when "Ctrl+B" is pressed in Student mode', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Student);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'b' });
    document.dispatchEvent(event);

    expect(mockDispatch).not.toHaveBeenCalled();
    removeKeyBindings();
  });

  // "Ctrl + E" or "Cmd + E" for inserting code area underneath (Student mode)
  it('should trigger inserting code area underneath command when "Ctrl+E" is pressed', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Student);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'e' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

  // "Ctrl + Shift + E" or "Cmd + Shift + E"  for inserting code area above (Teacher mode)
  it('should trigger inserting code area above command when "Ctrl+Shift+E" is pressed', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Teacher);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'e' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

  // "Ctrl + Shift + E" or "Cmd + Shift + E"  for inserting code area above (Student mode)
  it('should trigger inserting code area above command when "Ctrl+Shift+E" is pressed', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Student);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'e' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

  // "Ctrl + I" or "Cmd + I" for input insert command (only for teacher mode)
  it('should trigger inserting code area above command when "Ctrl+I" is pressed', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Teacher);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'i' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

  // "Ctrl + I" or "Cmd + I" for input insert command (only for teacher mode)
  it('should not trigger inserting code area above command when "Ctrl+I" is pressed when in Student mode', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Student);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'i' });
    document.dispatchEvent(event);

    expect(mockDispatch).not.toHaveBeenCalled();
    removeKeyBindings();
  });

  // "Ctrl + L" or "Cmd + L" for inserting math area underneath (Student mode)
  it('should trigger inserting math area underneath command when "Ctrl+L" is pressed when in Student mode', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Student);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'l' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

  // "Ctrl + L" or "Cmd + L" for inserting math area underneath (Teacher mode)
  it('should trigger inserting math area underneath command when "Ctrl+L" is pressed when in Teacher mode', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Teacher);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'l' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

  // "Ctrl + Shift + L" or "Cmd + Shift + L"  for inserting math area above (Student mode)
  it('should trigger inserting math area above command when "Ctrl+Shift+L" is pressed when in Student mode', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Student);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'l' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

  // "Ctrl + Shift + L" or "Cmd + Shift + L"  for inserting math area above (Teacher mode)
  it('should trigger inserting math area above command when "Ctrl+Shift+L" is pressed when in Teacher mode', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Teacher);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'l' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

  // "Ctrl + M" or "Cmd + M" for inserting code area underneath (Student mode)
  it('should trigger inserting math area underneath command when "Ctrl+M" is pressed when in Student mode', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Student);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'm' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

  // "Ctrl + M" or "Cmd + M" for inserting code area underneath (Teacher mode)
  it('should trigger inserting code area underneath command when "Ctrl+M" is pressed when in Teacher mode', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Teacher);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'm' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

  // "Ctrl + Shift + M" or "Cmd + Shift + M"  for inserting code area above (Teacher mode)
  it('should trigger inserting code area above command when "Ctrl+Shift+M" is pressed when in Teacher mode', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Teacher);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'm' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

  // "Ctrl + Shift + M" or "Cmd + Shift + M"  for inserting code area above (Student mode)
  it('should trigger inserting code area above command when "Ctrl+Shift+M" is pressed when in Student mode', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Student);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'm' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

  // "Ctrl + P" or "Cmd + P" for selecting parent node (Student mode)
  it('should trigger inserting code area underneath command when "Ctrl+P" is pressed when in Student mode', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Student);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'p' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

    // "Ctrl + P" or "Cmd + P" for selecting parent node (Teacher mode)
  it('should trigger inserting code area underneath command when "Ctrl+M" is pressed when in Teacher mode', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Teacher);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'p' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

  // "Ctrl + S" or "Cmd + S" for saving the file (only for teacher mode)
  it('should trigger saving file command when "Ctrl+S" is pressed when in Teacher mode', () => {
    const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
    const mockDispatch = jest.fn();
    editorView.dispatch = mockDispatch;

    proofFlow.getUserMode = jest.fn(() => UserMode.Teacher);
    const removeKeyBindings = applyGlobalKeyBindings(editorView);

    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 's' });
    document.dispatchEvent(event);

    expect(mockDispatch).toHaveBeenCalled();
    removeKeyBindings();
  });

 // "Ctrl + S" or "Cmd + S" for saving the file (will not be called in student mode)
 it('should not trigger saving file command when "Ctrl+S" is pressed when in Student mode', () => {
  const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
  const mockDispatch = jest.fn();
  editorView.dispatch = mockDispatch;

  proofFlow.getUserMode = jest.fn(() => UserMode.Teacher);
  const removeKeyBindings = applyGlobalKeyBindings(editorView);

  const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 's' });
  document.dispatchEvent(event);

  expect(mockDispatch).not.toHaveBeenCalled();
  removeKeyBindings();
});

// "Ctrl + Y" or "Cmd + Y" for redo (Student mode)
it('should trigger redo command when "Ctrl+Y" is pressed when in Student mode', () => {
  const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
  const mockDispatch = jest.fn();
  editorView.dispatch = mockDispatch;

  proofFlow.getUserMode = jest.fn(() => UserMode.Student);
  const removeKeyBindings = applyGlobalKeyBindings(editorView);

  const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'y' });
  document.dispatchEvent(event);

  expect(mockDispatch).toHaveBeenCalled();
  removeKeyBindings();
});

// "Ctrl + Y" or "Cmd + Y" for redo (Teacher mode)
it('should trigger redo command when "Ctrl+Y" is pressed when in Teacher mode', () => {
  const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
  const mockDispatch = jest.fn();
  editorView.dispatch = mockDispatch;

  proofFlow.getUserMode = jest.fn(() => UserMode.Teacher);
  const removeKeyBindings = applyGlobalKeyBindings(editorView);

  const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'y' });
  document.dispatchEvent(event);

  expect(mockDispatch).toHaveBeenCalled();
  removeKeyBindings();
});

// "Ctrl + Z" or "Cmd + Z" for undo (Student mode)
it('should trigger undo command when "Ctrl+z" is pressed when in Student mode', () => {
  const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
  const mockDispatch = jest.fn();
  editorView.dispatch = mockDispatch;

  proofFlow.getUserMode = jest.fn(() => UserMode.Student);
  const removeKeyBindings = applyGlobalKeyBindings(editorView);

  const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'z' });
  document.dispatchEvent(event);

  expect(mockDispatch).toHaveBeenCalled();
  removeKeyBindings();
});

// "Ctrl + Z" or "Cmd + Z" for undo (Teacher mode)
it('should trigger redo command when "Ctrl+Y" is pressed when in Teacher mode', () => {
  const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
  const mockDispatch = jest.fn();
  editorView.dispatch = mockDispatch;

  proofFlow.getUserMode = jest.fn(() => UserMode.Teacher);
  const removeKeyBindings = applyGlobalKeyBindings(editorView);

  const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'z' });
  document.dispatchEvent(event);

  expect(mockDispatch).toHaveBeenCalled();
  removeKeyBindings();
});

// "Escape" for closing the settings overlay (Teacher mode)
it('should trigger closing settings overlat command when "Escape" is pressed when in Teacher mode', () => {
  const editorView = new EditorView(document.createElement('div'), { state: EditorState.create(new EditorState()) });
  const mockDispatch = jest.fn();
  editorView.dispatch = mockDispatch;

  proofFlow.getUserMode = jest.fn(() => UserMode.Teacher);
  const removeKeyBindings = applyGlobalKeyBindings(editorView);

  const event = new KeyboardEvent('keydown', { 'key': 'Escape' });
  document.dispatchEvent(event);

  expect(mockDispatch).toHaveBeenCalled();
  removeKeyBindings();
});

});