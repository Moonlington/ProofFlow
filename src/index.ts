import { createTextBlock, openOriginalCoqFile } from './ProofFlow/ProofFlow';
import {
  AcceptedFileTypes,
  isCorrectFileType,
} from './ProofFlow/AcceptedFileTypes';

// Button to create new text blocks
let button = document.getElementById('newtextblock');
button?.addEventListener('click', (e) => {
  createTextBlock('');
});

// Input to read file
document
  .getElementById('file-input')
  ?.addEventListener('change', readSingleFile, false);

// Reads a file and checks if the format is correct, if so it sends it to the editor to open it
function readSingleFile(e: Event) {
  if (!e.target) return;
  let fileList = (<HTMLInputElement>e.target).files;
  if (!fileList) return;
  let file = fileList[0];
  let fileType = isCorrectFileType(file);
  if (fileType === AcceptedFileTypes.Unknown) {
    console.log('Sorry, this file type is currently not supported');
    return;
  }
  let reader = new FileReader();
  reader.readAsText(file, 'UTF-8');
  reader.onloadend = (readerEvent: ProgressEvent<FileReader>) => {
    if (readerEvent?.target?.result) {
      let result = readerEvent.target.result.toString();
      openOriginalCoqFile(result);
    }
  };
}
