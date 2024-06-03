import { autocompletion } from '@codemirror/autocomplete';

// TODO: Finish autocomplete functionality
// export const codeCompl = autocompletion({
//     override: [
//         (context) => {
//             let triggered = false; // Set to true if the cursor is positioned right after a trigger character (from server capabilities).
//             let triggerCharacter = void 0; // If triggered, set this to the trigger character.
//             if (triggered || context.explicit) {
//                 return requestCompletion(context, {
//                     kind: triggered ? 2 : 1
//                     character: triggerCharacter
//                 });
//             }
//         }
//     ]
// })

// TODO: Implement requestCompletion for the LSP functions
// requestCompletion(context, trigger) {
//     this.sendChange(/* ... */);
//
//     return this.client.request({
//         method: 'textDocument/completion',
//         params: { /* ... */ }
//     }, timeout).then((result) => {
//         let completions; // Transform result.items to CodeMirror's Completion objects.
//         return completions;
//     });
// }
