import { proofFlow } from "../../main.ts";

// Enum representing whether a textbox is locked or open to alter
export enum UserMode {
  Student, // Area is unlocked to alter or delete by any type of user
  Teacher, // Area is locked and cannot be altered or deleted
}

export function switchUserMode(UserModebutton: HTMLElement) {
  const teacherMode = proofFlow.userMode;
  const inputButton = document.getElementById("input-button");
  if (!inputButton) throw new Error("input-button not found");
  if (teacherMode === UserMode.Teacher) {
    proofFlow.userMode = UserMode.Student;
    UserModebutton.textContent = "Student Mode";
    inputButton.style.visibility = "hidden";
    lockEditing(true);
  } else {
    proofFlow.userMode = UserMode.Teacher;
    UserModebutton.textContent = "Teacher Mode";
    inputButton.style.visibility = "visible";
    lockEditing(false);
  }
}

export function lockEditing(lock: boolean) {
  const allAreas = document.getElementById("ProofFlowEditor")?.children;

  if (allAreas) {
    Array.from(allAreas).forEach((area) => {
      if (
        area.classList.contains("markdown") ||
        area.classList.contains("cm-editor")
      ) {
        lockIt(area, lock);
        if (area.classList.contains("cm-editor")) {
          area.classList.toggle("unlocked", lock);
        }
      }
    });
  }
}

function lockIt(Area: Element, lock: boolean) {
  const allMarkdownElements = Area.querySelectorAll("*");

  allMarkdownElements.forEach((element) => {
    element.setAttribute("contenteditable", lock ? "false" : "true");
  });
}
