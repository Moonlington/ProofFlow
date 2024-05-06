import { BangleEditor, BangleEditorState } from '@bangle.dev/core';

// 'editor' is the id of the dom Node on which bangle will
// be mounted.
const editorNode = document.getElementById('root');

const state = new BangleEditorState({
  initialValue: 'Hello world!',
});

const editor = new BangleEditor(editorNode, { state });

const view = editor.view;
// Programmatically type
view.dispatch(view.state.tr.insertText('Wow'));

function readSingleFile(e) {
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = e.target.result;
    displayContents(contents);
  };
  reader.readAsText(file);
}

function displayContents(contents) {
  var element = document.getElementById('file-content');
  element.textContent = contents;

  let state = view.state;
  let tr = state.tr;

  const transaction = tr.insertText("Teesst");
  view.dispatch(transaction);
}

document.getElementById('file-input')
  .addEventListener('change', readSingleFile, false);