import { requestCompletion} from '../../basicLspFunctions.ts'
import { ProofFlow } from '../../editor/ProofFlow.ts';
import { autocompletion, CompletionContext } from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";

let timeoutID: any;

function debounce(func: any, delay: any) {
    return (...args : any[]) => {
        if (timeoutID) {
            clearTimeout(timeoutID);
        }
        timeoutID = setTimeout(() => {
            func(...args);
        }, delay);
    };
}

export const codeCompl = autocompletion({
    override: [
        async (context: CompletionContext) => {
            let PF = ProofFlow.getInstance();
            let triggered = false;
            let triggerCharacter = context.matchBefore(/\w*/);

            if (context.explicit || triggered) {
                debounce(async () => {
                    console.log("context.explicit or triggered", context);
                    const completionItems = await requestCompletion(
                        PF.fileName,
                        context,
                        {
                        kind: triggered ? 2 : 1,
                        character: triggerCharacter
                        });

                    console.log("completionItems:", completionItems);

                    return {
                        from: context.pos,
                        options: completionItems.items.map((item: { label: any; kind: any; }) => ({
                            label: item.label,
                            type: item.kind
                        }))
                    };
                }, 1000)();
            }

            return null;
        }
    ]
});

