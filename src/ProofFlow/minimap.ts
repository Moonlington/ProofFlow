export class Minimap {
  private _minimapDiv: HTMLDivElement;
  private _minimapSizeDiv: HTMLDivElement;
  private _minimapViewerDiv: HTMLDivElement;
  private _minimapContentDiv: HTMLIFrameElement;
  private _bodyScale = 0;
  private _realScale = 0;
  private _config = { attributes: true, childList: true, subtree: true };
  private observer: MutationObserver;

  private timeoutIdHTML: NodeJS.Timeout | null = null;
  private timeoutIdScroll: NodeJS.Timeout | null = null;
  private timeoutIdResize: NodeJS.Timeout | null = null;
  private debounceDelay = 1000; // Adjust delay as needed
  private on = false;

  constructor() {
    this._minimapDiv = document.createElement("div");
    this._minimapSizeDiv = document.createElement("div");
    this._minimapViewerDiv = document.createElement("div");
    this._minimapContentDiv = document.createElement("iframe");

    this._minimapDiv.className = "minimap__container";
    this._minimapSizeDiv.className = "minimap__size";
    this._minimapViewerDiv.className = "minimap__viewer";
    this._minimapContentDiv.className = "minimap__content";

    this._minimapDiv.append(
      this._minimapSizeDiv,
      this._minimapViewerDiv,
      this._minimapContentDiv,
    );

    document.getElementById("content")!.appendChild(this._minimapDiv);

    this.observer = new MutationObserver(this.callback);
    this.start();
  }

  public destroy() {
    this.stop();
    const elements = document.body.getElementsByClassName(
      this._minimapDiv.className,
    );
    for (let element of elements) {
      document.getElementById("content")!.removeChild(element);
    }
  }

  public switch() {
    if (this.on) this.stop();
    else this.start();
  }

  public start() {
    this._minimapDiv.setAttribute("visible", "true");
    this.updateHTML();
    this.getDimensions();
    this.trackScroll();

    const editor = document.getElementById("editor");
    this.observer.observe(editor!, this._config);
    editor!.addEventListener("scroll", () => {
      if (this.timeoutIdScroll != null) return;
      this.timeoutIdScroll = setTimeout(
        this.trackScroll.bind(this),
        this.debounceDelay / 24,
      );
    });
    editor!.addEventListener("resize", () => {
      if (this.timeoutIdResize != null) return;
      this.timeoutIdResize = setTimeout(
        this.getDimensions.bind(this),
        this.debounceDelay / 24,
      );
    });
    this.on = true;
  }

  public stop() {
    this._minimapDiv.setAttribute("visible", "false");
    this.timeoutIdHTML = null;
    this.timeoutIdScroll = null;
    this.timeoutIdResize = null;
    const editor = document.getElementById("editor");
    this.observer.disconnect();
    editor!.removeEventListener("scroll", () => this.trackScroll);
    editor!.addEventListener("resize", () => this.getDimensions);
    this.on = false;
  }

  private callback = (
    _mutationList: MutationRecord[],
    _bservero: MutationObserver,
  ) => {
    if (this.timeoutIdHTML != null) return;
    this.timeoutIdHTML = setTimeout(
      this.updateHTML.bind(this),
      this.debounceDelay,
    );
  };

  public updateHTML() {
    // console.log("updateHTML");
    this.timeoutIdHTML = null;

    const editor = document.getElementById("editor");
    const html = editor!.innerHTML;

    let iframeDoc = this._minimapContentDiv.contentWindow!.document;

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    const styleTags = document.querySelectorAll("style");
    styleTags.forEach((styleTag) => {
      const newStyleTag = iframeDoc.createElement("style");
      newStyleTag.textContent = styleTag.textContent;
      iframeDoc.head.appendChild(newStyleTag);
    });

    this.getDimensions();
    this.trackScroll();
  }

  private getDimensions() {
    this.timeoutIdResize = null;
    const editor = document.getElementById("editor");

    let bodyWidth = editor!.clientWidth;
    let bodyHeight = editor!.scrollHeight;
    let bodyRatio = bodyHeight / bodyWidth;
    let winRatio = window.innerHeight / window.innerWidth;

    this._minimapDiv.style.width = "15%";

    this._realScale = this._minimapDiv.clientWidth / bodyWidth;
    this._bodyScale = this._minimapDiv.clientWidth / document.body.clientWidth;

    this._minimapSizeDiv.style.paddingTop = `${bodyRatio * 100}%`;
    this._minimapViewerDiv.style.paddingTop = `${winRatio * 100}%`;

    this._minimapViewerDiv.style.height = `${editor!.clientHeight * this._bodyScale}px`;

    this._minimapContentDiv.style.transform = `scale(${this._realScale})`;
    this._minimapContentDiv.style.width = `${100 / this._realScale}%`;
    this._minimapContentDiv.style.height = `${bodyHeight / this._realScale}%`;
  }

  private trackScroll() {
    this.timeoutIdScroll = null;

    const editor = document.getElementById("editor");

    const viewerOffset = editor!.scrollTop * this._realScale * 0.5;
    const otherSpace =
      this._minimapDiv.clientHeight - this._minimapViewerDiv.clientHeight;
    if (viewerOffset <= otherSpace) {
      this._minimapContentDiv.style.transform = `translateY(${-viewerOffset}px) scale(${this._realScale})`;
      this._minimapViewerDiv.style.transform = `translateY(${viewerOffset}px)`;
    } else {
      const extraOffset = editor!.scrollTop * this._realScale * 0.5;
      this._minimapContentDiv.style.transform = `translateY(${-viewerOffset - (extraOffset - otherSpace)}px) scale(${this._realScale})`;
      this._minimapViewerDiv.style.transform = `translateY(${otherSpace}px)`;
    }
  }
}
