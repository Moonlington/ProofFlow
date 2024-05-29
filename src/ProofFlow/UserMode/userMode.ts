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
    } else {
        proofFlow.userMode = UserMode.Teacher;
        UserModebutton.textContent = "Teacher Mode";
        inputButton.style.visibility = "visible";
    }
}
