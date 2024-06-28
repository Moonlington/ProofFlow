import { proofFlow } from "../../main.ts";
import { renderAllMarkdown } from "../plugins/markdown-extra.ts";

// Enum representing whether a textbox is locked or open to alter
export enum UserMode {
  Student, // Area is unlocked to alter or delete by any type of user
  Teacher, // Area is locked and cannot be altered or deleted
}

/**
 * Handles the user mode switch.
 */
export function handleUserModeSwitch() {
  // render all Markdown
  renderAllMarkdown(proofFlow);

  // Get the current user mode and switch it
  const userMode = proofFlow.getUserMode();
  const inputButton = document.getElementById("input-button");
  const collapsibleButton = document.getElementById("collapse-button");

  // Error handling
  if (!inputButton) {
    throw new Error("input-button not found");
  }
  if (!collapsibleButton) {
    throw new Error("collapse-button not found");
  }

  // Set the display of the input and collapsible buttons based on the user mode
  if (userMode === UserMode.Student) {
    inputButton.style.display = "none";
    collapsibleButton.style.display = "none";
    lockEditing(true);
  }
  // If the user mode is teacher, the input and collapsible buttons are displayed
  else {
    inputButton.style.display = "";
    collapsibleButton.style.display = "";
    lockEditing(false);
  }
}

/**
 * Locks or unlocks the editing functionality based on the provided boolean value.
 * @param lock - A boolean value indicating whether to lock or unlock the editing functionality.
 */
export function lockEditing(lock: boolean) {
  const editorArea = document.getElementById("ProofFlowEditor");
  editorArea?.classList.toggle("locked", lock);

  // Lock or unlock all areas in the editor
  const allAreas = document.getElementById("ProofFlowEditor")?.children;

  if (allAreas) {
    Array.from(allAreas).forEach((area) => {
      if (area.classList.contains("markdown")) {
        lockMarkdown(area, lock);
      } else if (area.classList.contains("cm-editor")) {
        area.classList.toggle("unlocked", lock);
        lockCode(area, lock);
      } else if (area.classList.contains("collapsible")) {
        lockCollapsible(area, lock);
      }
    });
  }
}

/**
 * Locks or unlocks the markdown area and its child elements for editing.
 *
 * @param area - The markdown area element.
 * @param lock - A boolean value indicating whether to lock or unlock the area.
 */
function lockMarkdown(area: Element, lock: boolean) {
  area.setAttribute("contenteditable", lock ? "false" : "true");
  // Get all elements in the area
  const allMarkdownElements = area.querySelectorAll("*");

  // Lock or unlock all elements
  allMarkdownElements.forEach((element) => {
    element.setAttribute("contenteditable", lock ? "false" : "true");
  });
}

/**
 * Locks or unlocks the content of a given area.
 * @param area - The element containing the content to be locked or unlocked.
 * @param lock - A boolean value indicating whether to lock or unlock the content.
 */
function lockCode(area: Element, lock: boolean) {
  const content = area.querySelector(".cm-content");
  content?.setAttribute("contenteditable", lock ? "false" : "true");
}

/**
 * Locks or unlocks a collapsible area.
 *
 * @param area - The collapsible area element.
 * @param lock - A boolean value indicating whether to lock or unlock the area.
 */
function lockCollapsible(area: Element, lock: boolean) {
  const title = area.querySelector("collapsible_title");
  title?.setAttribute("contenteditable", lock ? "false" : "true");

  // Lock the content of the collapsible area
  const content = area.querySelector(".collapsible_content");
  const contentChildren = content?.children;

  // Lock or unlock all content children present in the collapsible area
  if (contentChildren) {
    Array.from(contentChildren).forEach((area) => {
      if (area.classList.contains("markdown")) {
        lockMarkdown(area, lock);
      } else if (area.classList.contains("cm-editor")) {
        area.classList.toggle("unlocked", lock);
        lockCode(area, lock);
      }
    });
  }
}
