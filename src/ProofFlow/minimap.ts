import { Plugin } from "prosemirror-state";

export let minimapPlugin: Plugin = new Plugin({

})

export class Minimap {
    private _minimapDiv: HTMLDivElement;
    private _minimapSizeDiv: HTMLDivElement;
    private _minimapViewerDiv: HTMLDivElement;
    private _minimapContentDiv: HTMLIFrameElement;
    private _bodyScale = 0;
    private _realScale = 0;

    constructor(html: string) {
        this._minimapDiv = document.createElement('div');
        this._minimapSizeDiv = document.createElement('div');
        this._minimapViewerDiv = document.createElement('div');
        this._minimapContentDiv = document.createElement('iframe');

        this._minimapDiv.className = 'minimap__container';
        this._minimapSizeDiv.className = 'minimap__size';
        this._minimapViewerDiv.className = 'minimap__viewer';
        this._minimapContentDiv.className = 'minimap__content';

        this._minimapDiv.append(this._minimapSizeDiv, this._minimapViewerDiv, this._minimapContentDiv);
        document.body.appendChild(this._minimapDiv);

        this.updateHTML();

        this.getDimensions()
        const editor = document.getElementById("editor");
        editor!.addEventListener('scroll', () => this.trackScroll())
        editor!.addEventListener('resize', () => this.getDimensions())
    }

    public updateHTML() {
        const editor = document.getElementById("editor");
        const html = editor!.innerHTML;

        let iframeDoc = this._minimapContentDiv.contentWindow!.document;

        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        const styleTags = document.querySelectorAll('style');
        styleTags.forEach(styleTag => {
            const newStyleTag = iframeDoc.createElement('style');
            newStyleTag.textContent = styleTag.textContent;
            iframeDoc.head.appendChild(newStyleTag);
        });
        
        this.trackScroll();
        this.getDimensions();
    }

    private getDimensions(){
        const editor = document.getElementById("editor");

        let bodyWidth = editor!.clientWidth;
        let bodyHeight = editor!.scrollHeight;
        let bodyRatio = bodyHeight / bodyWidth;
        let winRatio = window.innerHeight / window.innerWidth;
    
        this._minimapDiv.style.width = '15%';
        

        this._realScale = this._minimapDiv.clientWidth / bodyWidth;
        this._bodyScale = this._minimapDiv.clientWidth / document.body.clientWidth;
    
        this._minimapSizeDiv.style.paddingTop = `${bodyRatio * 100}%`
        this._minimapViewerDiv.style.paddingTop = `${winRatio * 100}%`;

        console.log(editor!.clientHeight, this._realScale);
        this._minimapViewerDiv.style.height = `${(editor!.clientHeight * this._bodyScale)}px`
    
        this._minimapContentDiv.style.transform = `scale(${this._realScale})`;
        this._minimapContentDiv.style.width = `${(100 / this._realScale)}%`
        this._minimapContentDiv.style.height = `${(100 / this._realScale)}%`
    }
    
    private trackScroll(){
        // console.log(this);
        const editor = document.getElementById("editor");
        this._minimapViewerDiv.style.transform = `translateY(${editor!.scrollTop * this._realScale}px)`
        // this._minimapContentDiv.style.transform = `translateY(${-editor!.scrollTop * this._realScale}px)`
    }
}