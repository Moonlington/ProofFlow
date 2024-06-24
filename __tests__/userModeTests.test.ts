// Import the functions from the UserMode file
import { _private } from '../src/ProofFlow/UserMode/userMode';

// Mocking the external functions (assuming they are imported)
jest.mock('../src/ProofFlow/UserMode/userMode', () => ({
  ...jest.requireActual('../src/ProofFlow/UserMode/userMode'),
  lockMarkdown: jest.fn(),
  lockCode: jest.fn(),
  lockCollapsible: jest.fn(),
}));

describe('lockEditing', () => {
  let mockEditorArea: HTMLElement;
  beforeEach(() => {
    // Setup mock structure for ProofFlowEditor and its children
    mockEditorArea = document.createElement('div');
    mockEditorArea.id = 'ProofFlowEditor';
    document.getElementById = jest.fn((id) => {
      if (id === 'ProofFlowEditor') return mockEditorArea;
      return null;
    });

    // Adding mock children with different classes
    const markdownArea = document.createElement('div');
    markdownArea.classList.add('markdown');
    const codeEditorArea = document.createElement('div');
    codeEditorArea.classList.add('cm-editor');
    const collapsibleArea = document.createElement('div');
    collapsibleArea.classList.add('collapsible');
    mockEditorArea.append(markdownArea, codeEditorArea, collapsibleArea);
  });

  it('should lock and unlock editing correctly', () => {
    // Lock editing
    _private.lockEditing(true);
    expect(mockEditorArea.classList.contains('locked')).toBe(true);
    const cmEditor = mockEditorArea.querySelector('.cm-editor');
    if (cmEditor !== null) {
      expect(cmEditor.classList.contains('unlocked')).toBe(true);
    } else {
      fail('Expected .cm-editor element to be present');
    }
    expect(_private.lockMarkdown).toHaveBeenCalledWith(expect.anything(), true);
    expect(_private.lockCode).toHaveBeenCalledWith(expect.anything(), true);
    expect(_private.lockCollapsible).toHaveBeenCalledWith(expect.anything(), true);

    // Unlock editing
    _private.lockEditing(false);
    expect(mockEditorArea.classList.contains('locked')).toBe(false);
    const cmEditor2 = mockEditorArea.querySelector('.cm-editor');
    if (cmEditor2 !== null) {
      expect(cmEditor2.classList.contains('unlocked')).toBe(true);
    } else {
      fail('Expected .cm-editor element to be present');
    }
    expect(_private.lockMarkdown).toHaveBeenCalledWith(expect.anything(), false);
    expect(_private.lockCode).toHaveBeenCalledWith(expect.anything(), false);
    expect(_private.lockCollapsible).toHaveBeenCalledWith(expect.anything(), false);
  });
});