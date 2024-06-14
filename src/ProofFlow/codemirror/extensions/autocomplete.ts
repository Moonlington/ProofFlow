import { ProofFlow } from '../../editor/ProofFlow.ts';
import { autocompletion, CompletionContext, Completion, CompletionResult } from "@codemirror/autocomplete";
import {
    CompletionTriggerKind,
} from 'vscode-languageserver-protocol';
import { EditorState as CMState } from '@codemirror/state';
import { Text } from '@codemirror/state';
import { LSPMessenger } from '../../../basicLspFunctions.ts';
import CodeMirrorView from '../codemirrorview.ts';
import { offsetToPos } from './mappinghelper.ts';

/**
 * Copied and modified from https://codemirror.net/examples/autocompletion/
 * 
 * Extension for autocomplete in CodeMirror
 * @param instance Relevant CodeMirror instance
 * @returns 
 */
export function getAutoCompleteExtension(instance: CodeMirrorView) {
    return autocompletion({
        override: [
            async (context: CompletionContext):Promise<any> => {
                console.log(instance);
                const { state, pos, explicit } = context;
                const line = state.doc.lineAt(pos);
    
                let trigKind: CompletionTriggerKind = CompletionTriggerKind.Invoked;
                let trigChar: string | undefined;
                    trigKind = CompletionTriggerKind.TriggerCharacter;
                    trigChar = line.text[pos - line.from - 1];
    
                const completionItems =  await LSPMessenger.requestCompletion(
                    ProofFlow.fileName,
                    context,
                    offsetToPos(instance, state.doc, pos),
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
}
