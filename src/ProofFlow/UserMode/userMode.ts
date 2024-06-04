import { proofFlow } from "../../main.ts";

// Enum representing whether a textbox is locked or open to alter
export enum UserMode {
  Student, // Area is unlocked to alter or delete by any type of user
  Teacher, // Area is locked and cannot be altered or deleted
}

export function handleUserModeSwitch() {
  const userMode = proofFlow.getUserMode();
  const inputButton = document.getElementById("input-button");
  if (!inputButton) throw new Error("input-button not found");
  if (userMode === UserMode.Student) {
    inputButton.style.visibility = "hidden";
    lockEditing(true);
  } else {
    inputButton.style.visibility = "visible";
    lockEditing(false);
  }
}

export function lockEditing(lock: boolean) {
  const editorArea = document.getElementById("ProofFlowEditor");

  editorArea?.classList.toggle("locked", lock);

  const allAreas = document.getElementById("ProofFlowEditor")?.children;

  if (allAreas) {
    Array.from(allAreas).forEach((area) => {
      if (area.classList.contains("markdown")) {
        lockMarkdown(area, lock);
      } else if (area.classList.contains("cm-editor")) {
        console.log("here");
        area.classList.toggle("unlocked", lock);
        lockCode(area, lock);
      }
    });
  }
}

function lockMarkdown(area: Element, lock: boolean) {
  area.setAttribute("contenteditable", lock ? "false" : "true");
  const allMarkdownElements = area.querySelectorAll("*");

  allMarkdownElements.forEach((element) => {
    element.setAttribute("contenteditable", lock ? "false" : "true");
  });
}

function lockCode(area: Element, lock: boolean) {
  const content = area.querySelector(".cm-content");
  console.log(content);
  content?.setAttribute("contenteditable", lock ? "false" : "true");
}
