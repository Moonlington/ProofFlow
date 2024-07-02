// Import the functions from the UserMode file
import { _private, UserMode, handleUserModeSwitch, lockEditing, lockMarkdown, lockCode, lockCollapsible } from '../src/ProofFlow/UserMode/userMode';

// Mocking the external functions
jest.mock('../src/ProofFlow/UserMode/userMode', () => ({
  ...jest.requireActual('../src/ProofFlow/UserMode/userMode'),
  lockMarkdown: jest.fn(),
  lockCode: jest.fn(),
  lockCollapsible: jest.fn(),
}));

// Testing the handleUserModeSwitch function
describe('handleUserModeSwitch', () => {

  // inputButton and collapsibleButton are hidden when userMode is Student
  it('should hide inputButton and collapsibleButton when userMode is Student', () => {
    // Arrange
    document.body.innerHTML = `
      <button id="input-button"></button>
      <button id="collapse-button"></button>
    `;
    const mockProofFlow = {
      getUserMode: jest.fn().mockReturnValue(UserMode.Student),
    };
    (global as any).proofFlow = mockProofFlow;

    // Act
    handleUserModeSwitch();

    // Assert
    const inputButton = document.getElementById("input-button");
    const collapsibleButton = document.getElementById("collapse-button");
    expect(inputButton?.style.display).toBe("none");
    expect(collapsibleButton?.style.display).toBe("none");
  });

  // proofFlow.getUserMode returns an undefined or null value
  it('should throw an error when proofFlow.getUserMode returns undefined or null', () => {
    // Arrange
    document.body.innerHTML = `
      <button id="input-button"></button>
      <button id="collapse-button"></button>
    `;
    const mockProofFlow = {
      getUserMode: jest.fn().mockReturnValue(null),
    };
    (global as any).proofFlow = mockProofFlow;

    // Act & Assert
    expect(() => handleUserModeSwitch()).toThrowError();
  });
});

// Testing the lockEditing function
describe('lockEditing', () => {

  // Locks all markdown areas when lock is true
  it('should lock all markdown areas when lock is true', () => {
    document.body.innerHTML = `
      <div id="ProofFlowEditor">
        <div class="markdown"></div>
        <div class="markdown"></div>
      </div>
    `;
    const editorArea = document.getElementById("ProofFlowEditor");
    lockEditing(true);
    const markdownAreas = editorArea?.querySelectorAll(".markdown");
    markdownAreas?.forEach((area) => {
      expect(area.getAttribute("contenteditable")).toBe("false");
    });
  });

  // Handles null or undefined editorArea
  it('should handle null or undefined editorArea', () => {
    document.body.innerHTML = ``;
    expect(() => lockEditing(true)).not.toThrow();
  });
});

// Tests lockMarkdown function
describe('lockMarkdown', () => {

  // lockMarkdown sets contenteditable to false when lock is true
  it('should set contenteditable to false when lock is true', () => {
    document.body.innerHTML = '<div id="markdownArea" class="markdown"><p>Test</p></div>';
    const area = document.getElementById('markdownArea');
    if (area) {
      lockMarkdown(area, true);
      expect(area.getAttribute('contenteditable')).toBe('false');
      area.querySelectorAll('*').forEach((element) => {
        expect(element.getAttribute('contenteditable')).toBe('false');
      });
    } else {
      throw new Error('Area element not found');
    }
  });

  // lockMarkdown handles elements with no children
  it('should handle elements with no children', () => {
    document.body.innerHTML = '<div id="markdownArea" class="markdown"></div>';
    const area = document.getElementById('markdownArea');
    if (area) {
      lockMarkdown(area, true);
      expect(area.getAttribute('contenteditable')).toBe('false');
    } else {
      throw new Error('Area element not found');
    }
  });
});

// Tests lockCode function
describe('lockCode', () => {

  // Sets contenteditable to "false" when lock is true
  it('should set contenteditable to "false" when lock is true', () => {
    document.body.innerHTML = '<div class="cm-editor"><div class="cm-content"></div></div>';
    const area = document.querySelector('.cm-editor');
    // Checks if area is not null
    if (area) {
      lockCode(area, true);
      const content = area.querySelector('.cm-content');
      // Checks if content is not null
      if (content) {
        expect(content.getAttribute('contenteditable')).toBe('false');
      // If content is null
      } else {
        throw new Error('Content element not found');
      }
    // If area is null
    } else {
      throw new Error('Area element not found');
    }
    
  });
});

// Tests the locking and unlocking of collapsible areas
describe('lockCollapsible', () => {
  // Locks the title of the collapsible area when lock is true
  it('should set contenteditable to false for the title when lock is true', () => {
    document.body.innerHTML = `
      <div class="collapsible">
        <div class="collapsible_title">Title</div>
        <div class="collapsible_content"></div>
      </div>
    `;
    const area = document.querySelector('.collapsible');
    // Checks if area is not null
    if (area) {
      lockCollapsible(area, true);
      const title = area.querySelector('.collapsible_title');
      // Checks if title is not null
      if (title) {
      expect(title.getAttribute('contenteditable')).toBe('false');
      // Title is null
      } else {
        throw new Error('Title element not found');
      }
    // Area is null
    } else {
      throw new Error('Area element not found');
    }

  });

  // Handles collapsible areas with no title element
  it('should not throw an error when there is no title element', () => {
    document.body.innerHTML = `
      <div class="collapsible">
        <div class="collapsible_content"></div>
      </div>
    `;
    const area = document.querySelector('.collapsible');
    if (area) {
      expect(() => lockCollapsible(area, true)).not.toThrow();
    } else {
      throw new Error('Area element not found');
    }
  });
});


