import { ProofFlow } from '../../editor/ProofFlow.ts';
import { autocompletion, CompletionContext, Completion, CompletionResult } from "@codemirror/autocomplete";
import {
    CompletionTriggerKind,
} from 'vscode-languageserver-protocol';
import { EditorState as CMState } from '@codemirror/state';
import { Text } from '@codemirror/state';
import { LSPMessenger } from '../../../basicLspFunctions.ts';

function offsetToPos(doc: Text, offset: number) {
    const line = doc.lineAt(offset);
    const character = offset - line.from;
    console.log('Line:', line, 'Character:', character);

    return {line: line.number, character};
}

export const codeCompl = autocompletion({
    override: [
        async (context: CompletionContext):Promise<any> => {
            const { state, pos, explicit } = context;
            const line = state.doc.lineAt(pos);

            let trigKind: CompletionTriggerKind = CompletionTriggerKind.Invoked;
            let trigChar: string | undefined;
                trigKind = CompletionTriggerKind.TriggerCharacter;
                trigChar = line.text[pos - line.from - 1];

            const completionItems =  await LSPMessenger.requestCompletion(
                ProofFlow.fileName,
                context,
                offsetToPos(state.doc, pos),
                {
                    triggerKind: trigKind,
                    triggerCharacter: trigChar,
                }
            );

            return {
                from: context.pos,
                options: completionItems.items.map((item: { label: any; kind: any; }) => ({
                    label: item.label,
                    type: item.kind
                }))
            };
        }
    ]
});
