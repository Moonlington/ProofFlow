import { adjustLeftDivWidth } from "../main";

/**
 * Minimap class
 */
export class Minimap {
  private _minimapDiv: HTMLDivElement; // The minimap container
  private _minimapSizeDiv: HTMLDivElement; // The minimap size div
  private _minimapViewerDiv: HTMLDivElement; // The minimap viewer div
  private _minimapContentDiv: HTMLIFrameElement; // The minimap content div
  private _bodyScale = 0; // The scale of the body
  private _realScale = 0; // The real scale of the minimap
  private _config = { attributes: true, childList: true, subtree: true }; // The config for the observer
  private observer: MutationObserver; // The observer

  private timeoutIdHTML: NodeJS.Timeout | null = null; // The timeout for the HTML update
  private timeoutIdScroll: NodeJS.Timeout | null = null; // The timeout for the scroll update
  private timeoutIdResize: NodeJS.Timeout | null = null; // The timeout for the resize update
  private debounceDelay = 1000; // Adjust delay as needed
  private on = false; // The state of the minimap

  /**
   * Constructor for the minimap
   */
  constructor() {
    this._minimapDiv = document.createElement("div");
    this._minimapSizeDiv = document.createElement("div");
    this._minimapViewerDiv = document.createElement("div");
    this._minimapContentDiv = document.createElement("iframe");

    this._minimapDiv.className = "minimap__container";
    this._minimapSizeDiv.className = "minimap__size";
    this._minimapViewerDiv.className = "minimap__viewer";
    this._minimapContentDiv.className = "minimap__content";

    this._minimapDiv.id = "miniMapContainer";

    this._minimapDiv.append(
      this._minimapSizeDiv,
      this._minimapViewerDiv,
      this._minimapContentDiv,
    );

    document.getElementById("container")!.appendChild(this._minimapDiv);

    this.observer = new MutationObserver(this.callback);
    this.start();
  }

  /**
   * Destroy the minimap
   */
  public destroy() {
    this.stop();
    const elements = document.body.getElementsByClassName(
      this._minimapDiv.className,
    );
    for (let element of elements) {
      console.log(element);
      document.getElementById("container")!.removeChild(element);
    }
  }

  /**
   * Switch the minimap on or off
   */
  public switch() {
    if (this.on) this.stop();
    else this.start();
    // ensure the left div is resized
    adjustLeftDivWidth();
  }

  /**
   * Start the minimap
   */
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

  // Stop the minimap
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

  // The callback for the observer
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

  // Update the HTML of the minimap
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

  // Get the dimensions of the minimap
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

    this._minimapViewerDiv.style.height = `${editor!.clientHeight * this._bodyScale * 2}px`;

    this._minimapContentDiv.style.transform = `scale(${this._realScale})`;
    this._minimapContentDiv.style.width = `${100 / this._realScale}%`;
    this._minimapContentDiv.style.height = `${bodyHeight / this._realScale}%`;
  }

  // Track the scroll of the minimap
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
