export class Minimap {
    private _minimapDiv: HTMLDivElement;
    private _minimapSizeDiv: HTMLDivElement;
    private _minimapViewerDiv: HTMLDivElement;
    private _minimapContentDiv: HTMLIFrameElement;
    private scale = 0.1;
    private realScale = 0;

    constructor() {
        this._minimapDiv = document.createElement('div');
        this._minimapSizeDiv = document.createElement('div');
        this._minimapViewerDiv = document.createElement('div');
        this._minimapContentDiv = document.createElement('iframe');

        this._minimapDiv.className = 'minimap__container';
        this._minimapSizeDiv.className = 'minimap__size';
        this._minimapViewerDiv.className = 'minimap__viewer';
        this._minimapContentDiv.className = 'minimap__content';

        this._minimapDiv.append(this._minimapSizeDiv, this._minimapContentDiv, this._minimapContentDiv);
        document.body.appendChild(this._minimapDiv);

        let html = document.documentElement.outerHTML.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        let iframeDoc = this._minimapContentDiv.contentWindow!.document;

        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        this.getDimensions()
        window.addEventListener('scroll', this.trackScroll)
        window.addEventListener('resize', this.getDimensions)
    }

    private getDimensions(){
        let bodyWidth = document.body.clientWidth;
        let bodyRatio = document.body.clientHeight / bodyWidth;
        let winRatio = window.innerHeight / window.innerWidth;
    
        console.log(this._minimapDiv.style);
        this._minimapDiv.style.width = '15%';
    
        this.realScale = this._minimapDiv.clientWidth / bodyWidth;
    
        this._minimapSizeDiv.style.paddingTop = `${bodyRatio * 100}%`
        this._minimapViewerDiv.style.paddingTop = `${winRatio * 100}%`;
    
        this._minimapContentDiv.style.transform = `scale(${this.realScale})`;
        this._minimapContentDiv.style.width = `${(100 / this.realScale)}%`
        this._minimapContentDiv.style.height = `${(100 / this.realScale)}%`
    }
    
    private trackScroll(){
        this._minimapViewerDiv.style.transform = `translateY(${window.scrollY * this.realScale}px)`
    }
}