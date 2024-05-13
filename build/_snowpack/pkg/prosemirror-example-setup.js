import { P as Plugin, M as Mapping, a as PluginKey, f as findWrapping, c as canJoin, j as joinPoint, N as NodeSelection, l as liftTarget, S as Selection, A as AllSelection, T as TextSelection, b as canSplit, r as replaceStep, R as ReplaceAroundStep, d as dropPoint } from './common/index-b14b0919.js';
import { S as Slice, F as Fragment, N as NodeRange } from './common/index-b21c4b07.js';
import { D as DecorationSet, a as Decoration } from './common/index-7a4ffd5c.js';

var base = {
  8: "Backspace",
  9: "Tab",
  10: "Enter",
  12: "NumLock",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  44: "PrintScreen",
  45: "Insert",
  46: "Delete",
  59: ";",
  61: "=",
  91: "Meta",
  92: "Meta",
  106: "*",
  107: "+",
  108: ",",
  109: "-",
  110: ".",
  111: "/",
  144: "NumLock",
  145: "ScrollLock",
  160: "Shift",
  161: "Shift",
  162: "Control",
  163: "Control",
  164: "Alt",
  165: "Alt",
  173: "-",
  186: ";",
  187: "=",
  188: ",",
  189: "-",
  190: ".",
  191: "/",
  192: "`",
  219: "[",
  220: "\\",
  221: "]",
  222: "'"
};

var shift = {
  48: ")",
  49: "!",
  50: "@",
  51: "#",
  52: "$",
  53: "%",
  54: "^",
  55: "&",
  56: "*",
  57: "(",
  59: ":",
  61: "+",
  173: "_",
  186: ":",
  187: "+",
  188: "<",
  189: "_",
  190: ">",
  191: "?",
  192: "~",
  219: "{",
  220: "|",
  221: "}",
  222: "\""
};

var mac = typeof navigator != "undefined" && /Mac/.test(navigator.platform);
var ie = typeof navigator != "undefined" && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);

// Fill in the digit keys
for (var i = 0; i < 10; i++) base[48 + i] = base[96 + i] = String(i);

// The function keys
for (var i = 1; i <= 24; i++) base[i + 111] = "F" + i;

// And the alphabetic keys
for (var i = 65; i <= 90; i++) {
  base[i] = String.fromCharCode(i + 32);
  shift[i] = String.fromCharCode(i);
}

// For each code that doesn't have a shift-equivalent, copy the base name
for (var code in base) if (!shift.hasOwnProperty(code)) shift[code] = base[code];

function keyName(event) {
  // On macOS, keys held with Shift and Cmd don't reflect the effect of Shift in `.key`.
  // On IE, shift effect is never included in `.key`.
  var ignoreKey = mac && event.metaKey && event.shiftKey && !event.ctrlKey && !event.altKey ||
      ie && event.shiftKey && event.key && event.key.length == 1 ||
      event.key == "Unidentified";
  var name = (!ignoreKey && event.key) ||
    (event.shiftKey ? shift : base)[event.keyCode] ||
    event.key || "Unidentified";
  // Edge sometimes produces wrong names (Issue #3)
  if (name == "Esc") name = "Escape";
  if (name == "Del") name = "Delete";
  // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8860571/
  if (name == "Left") name = "ArrowLeft";
  if (name == "Up") name = "ArrowUp";
  if (name == "Right") name = "ArrowRight";
  if (name == "Down") name = "ArrowDown";
  return name
}

const mac$1 = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;
function normalizeKeyName(name) {
    let parts = name.split(/-(?!$)/), result = parts[parts.length - 1];
    if (result == "Space")
        result = " ";
    let alt, ctrl, shift, meta;
    for (let i = 0; i < parts.length - 1; i++) {
        let mod = parts[i];
        if (/^(cmd|meta|m)$/i.test(mod))
            meta = true;
        else if (/^a(lt)?$/i.test(mod))
            alt = true;
        else if (/^(c|ctrl|control)$/i.test(mod))
            ctrl = true;
        else if (/^s(hift)?$/i.test(mod))
            shift = true;
        else if (/^mod$/i.test(mod)) {
            if (mac$1)
                meta = true;
            else
                ctrl = true;
        }
        else
            throw new Error("Unrecognized modifier name: " + mod);
    }
    if (alt)
        result = "Alt-" + result;
    if (ctrl)
        result = "Ctrl-" + result;
    if (meta)
        result = "Meta-" + result;
    if (shift)
        result = "Shift-" + result;
    return result;
}
function normalize(map) {
    let copy = Object.create(null);
    for (let prop in map)
        copy[normalizeKeyName(prop)] = map[prop];
    return copy;
}
function modifiers(name, event, shift = true) {
    if (event.altKey)
        name = "Alt-" + name;
    if (event.ctrlKey)
        name = "Ctrl-" + name;
    if (event.metaKey)
        name = "Meta-" + name;
    if (shift && event.shiftKey)
        name = "Shift-" + name;
    return name;
}
/**
Create a keymap plugin for the given set of bindings.

Bindings should map key names to [command](https://prosemirror.net/docs/ref/#commands)-style
functions, which will be called with `(EditorState, dispatch,
EditorView)` arguments, and should return true when they've handled
the key. Note that the view argument isn't part of the command
protocol, but can be used as an escape hatch if a binding needs to
directly interact with the UI.

Key names may be strings like `"Shift-Ctrl-Enter"`—a key
identifier prefixed with zero or more modifiers. Key identifiers
are based on the strings that can appear in
[`KeyEvent.key`](https:developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key).
Use lowercase letters to refer to letter keys (or uppercase letters
if you want shift to be held). You may use `"Space"` as an alias
for the `" "` name.

Modifiers can be given in any order. `Shift-` (or `s-`), `Alt-` (or
`a-`), `Ctrl-` (or `c-` or `Control-`) and `Cmd-` (or `m-` or
`Meta-`) are recognized. For characters that are created by holding
shift, the `Shift-` prefix is implied, and should not be added
explicitly.

You can use `Mod-` as a shorthand for `Cmd-` on Mac and `Ctrl-` on
other platforms.

You can add multiple keymap plugins to an editor. The order in
which they appear determines their precedence (the ones early in
the array get to dispatch first).
*/
function keymap(bindings) {
    return new Plugin({ props: { handleKeyDown: keydownHandler(bindings) } });
}
/**
Given a set of bindings (using the same format as
[`keymap`](https://prosemirror.net/docs/ref/#keymap.keymap)), return a [keydown
handler](https://prosemirror.net/docs/ref/#view.EditorProps.handleKeyDown) that handles them.
*/
function keydownHandler(bindings) {
    let map = normalize(bindings);
    return function (view, event) {
        let name = keyName(event), baseName, direct = map[modifiers(name, event)];
        if (direct && direct(view.state, view.dispatch, view))
            return true;
        // A character key
        if (name.length == 1 && name != " ") {
            if (event.shiftKey) {
                // In case the name was already modified by shift, try looking
                // it up without its shift modifier
                let noShift = map[modifiers(name, event, false)];
                if (noShift && noShift(view.state, view.dispatch, view))
                    return true;
            }
            if ((event.shiftKey || event.altKey || event.metaKey || name.charCodeAt(0) > 127) &&
                (baseName = base[event.keyCode]) && baseName != name) {
                // Try falling back to the keyCode when there's a modifier
                // active or the character produced isn't ASCII, and our table
                // produces a different name from the the keyCode. See #668,
                // #1060
                let fromCode = map[modifiers(baseName, event)];
                if (fromCode && fromCode(view.state, view.dispatch, view))
                    return true;
            }
        }
        return false;
    };
}

var GOOD_LEAF_SIZE = 200;

// :: class<T> A rope sequence is a persistent sequence data structure
// that supports appending, prepending, and slicing without doing a
// full copy. It is represented as a mostly-balanced tree.
var RopeSequence = function RopeSequence () {};

RopeSequence.prototype.append = function append (other) {
  if (!other.length) { return this }
  other = RopeSequence.from(other);

  return (!this.length && other) ||
    (other.length < GOOD_LEAF_SIZE && this.leafAppend(other)) ||
    (this.length < GOOD_LEAF_SIZE && other.leafPrepend(this)) ||
    this.appendInner(other)
};

// :: (union<[T], RopeSequence<T>>) → RopeSequence<T>
// Prepend an array or other rope to this one, returning a new rope.
RopeSequence.prototype.prepend = function prepend (other) {
  if (!other.length) { return this }
  return RopeSequence.from(other).append(this)
};

RopeSequence.prototype.appendInner = function appendInner (other) {
  return new Append(this, other)
};

// :: (?number, ?number) → RopeSequence<T>
// Create a rope repesenting a sub-sequence of this rope.
RopeSequence.prototype.slice = function slice (from, to) {
    if ( from === void 0 ) from = 0;
    if ( to === void 0 ) to = this.length;

  if (from >= to) { return RopeSequence.empty }
  return this.sliceInner(Math.max(0, from), Math.min(this.length, to))
};

// :: (number) → T
// Retrieve the element at the given position from this rope.
RopeSequence.prototype.get = function get (i) {
  if (i < 0 || i >= this.length) { return undefined }
  return this.getInner(i)
};

// :: ((element: T, index: number) → ?bool, ?number, ?number)
// Call the given function for each element between the given
// indices. This tends to be more efficient than looping over the
// indices and calling `get`, because it doesn't have to descend the
// tree for every element.
RopeSequence.prototype.forEach = function forEach (f, from, to) {
    if ( from === void 0 ) from = 0;
    if ( to === void 0 ) to = this.length;

  if (from <= to)
    { this.forEachInner(f, from, to, 0); }
  else
    { this.forEachInvertedInner(f, from, to, 0); }
};

// :: ((element: T, index: number) → U, ?number, ?number) → [U]
// Map the given functions over the elements of the rope, producing
// a flat array.
RopeSequence.prototype.map = function map (f, from, to) {
    if ( from === void 0 ) from = 0;
    if ( to === void 0 ) to = this.length;

  var result = [];
  this.forEach(function (elt, i) { return result.push(f(elt, i)); }, from, to);
  return result
};

// :: (?union<[T], RopeSequence<T>>) → RopeSequence<T>
// Create a rope representing the given array, or return the rope
// itself if a rope was given.
RopeSequence.from = function from (values) {
  if (values instanceof RopeSequence) { return values }
  return values && values.length ? new Leaf(values) : RopeSequence.empty
};

var Leaf = /*@__PURE__*/(function (RopeSequence) {
  function Leaf(values) {
    RopeSequence.call(this);
    this.values = values;
  }

  if ( RopeSequence ) Leaf.__proto__ = RopeSequence;
  Leaf.prototype = Object.create( RopeSequence && RopeSequence.prototype );
  Leaf.prototype.constructor = Leaf;

  var prototypeAccessors = { length: { configurable: true },depth: { configurable: true } };

  Leaf.prototype.flatten = function flatten () {
    return this.values
  };

  Leaf.prototype.sliceInner = function sliceInner (from, to) {
    if (from == 0 && to == this.length) { return this }
    return new Leaf(this.values.slice(from, to))
  };

  Leaf.prototype.getInner = function getInner (i) {
    return this.values[i]
  };

  Leaf.prototype.forEachInner = function forEachInner (f, from, to, start) {
    for (var i = from; i < to; i++)
      { if (f(this.values[i], start + i) === false) { return false } }
  };

  Leaf.prototype.forEachInvertedInner = function forEachInvertedInner (f, from, to, start) {
    for (var i = from - 1; i >= to; i--)
      { if (f(this.values[i], start + i) === false) { return false } }
  };

  Leaf.prototype.leafAppend = function leafAppend (other) {
    if (this.length + other.length <= GOOD_LEAF_SIZE)
      { return new Leaf(this.values.concat(other.flatten())) }
  };

  Leaf.prototype.leafPrepend = function leafPrepend (other) {
    if (this.length + other.length <= GOOD_LEAF_SIZE)
      { return new Leaf(other.flatten().concat(this.values)) }
  };

  prototypeAccessors.length.get = function () { return this.values.length };

  prototypeAccessors.depth.get = function () { return 0 };

  Object.defineProperties( Leaf.prototype, prototypeAccessors );

  return Leaf;
}(RopeSequence));

// :: RopeSequence
// The empty rope sequence.
RopeSequence.empty = new Leaf([]);

var Append = /*@__PURE__*/(function (RopeSequence) {
  function Append(left, right) {
    RopeSequence.call(this);
    this.left = left;
    this.right = right;
    this.length = left.length + right.length;
    this.depth = Math.max(left.depth, right.depth) + 1;
  }

  if ( RopeSequence ) Append.__proto__ = RopeSequence;
  Append.prototype = Object.create( RopeSequence && RopeSequence.prototype );
  Append.prototype.constructor = Append;

  Append.prototype.flatten = function flatten () {
    return this.left.flatten().concat(this.right.flatten())
  };

  Append.prototype.getInner = function getInner (i) {
    return i < this.left.length ? this.left.get(i) : this.right.get(i - this.left.length)
  };

  Append.prototype.forEachInner = function forEachInner (f, from, to, start) {
    var leftLen = this.left.length;
    if (from < leftLen &&
        this.left.forEachInner(f, from, Math.min(to, leftLen), start) === false)
      { return false }
    if (to > leftLen &&
        this.right.forEachInner(f, Math.max(from - leftLen, 0), Math.min(this.length, to) - leftLen, start + leftLen) === false)
      { return false }
  };

  Append.prototype.forEachInvertedInner = function forEachInvertedInner (f, from, to, start) {
    var leftLen = this.left.length;
    if (from > leftLen &&
        this.right.forEachInvertedInner(f, from - leftLen, Math.max(to, leftLen) - leftLen, start + leftLen) === false)
      { return false }
    if (to < leftLen &&
        this.left.forEachInvertedInner(f, Math.min(from, leftLen), to, start) === false)
      { return false }
  };

  Append.prototype.sliceInner = function sliceInner (from, to) {
    if (from == 0 && to == this.length) { return this }
    var leftLen = this.left.length;
    if (to <= leftLen) { return this.left.slice(from, to) }
    if (from >= leftLen) { return this.right.slice(from - leftLen, to - leftLen) }
    return this.left.slice(from, leftLen).append(this.right.slice(0, to - leftLen))
  };

  Append.prototype.leafAppend = function leafAppend (other) {
    var inner = this.right.leafAppend(other);
    if (inner) { return new Append(this.left, inner) }
  };

  Append.prototype.leafPrepend = function leafPrepend (other) {
    var inner = this.left.leafPrepend(other);
    if (inner) { return new Append(inner, this.right) }
  };

  Append.prototype.appendInner = function appendInner (other) {
    if (this.left.depth >= Math.max(this.right.depth, other.depth) + 1)
      { return new Append(this.left, new Append(this.right, other)) }
    return new Append(this, other)
  };

  return Append;
}(RopeSequence));

// ProseMirror's history isn't simply a way to roll back to a previous
// state, because ProseMirror supports applying changes without adding
// them to the history (for example during collaboration).
//
// To this end, each 'Branch' (one for the undo history and one for
// the redo history) keeps an array of 'Items', which can optionally
// hold a step (an actual undoable change), and always hold a position
// map (which is needed to move changes below them to apply to the
// current document).
//
// An item that has both a step and a selection bookmark is the start
// of an 'event' — a group of changes that will be undone or redone at
// once. (It stores only the bookmark, since that way we don't have to
// provide a document until the selection is actually applied, which
// is useful when compressing.)
// Used to schedule history compression
const max_empty_items = 500;
class Branch {
    constructor(items, eventCount) {
        this.items = items;
        this.eventCount = eventCount;
    }
    // Pop the latest event off the branch's history and apply it
    // to a document transform.
    popEvent(state, preserveItems) {
        if (this.eventCount == 0)
            return null;
        let end = this.items.length;
        for (;; end--) {
            let next = this.items.get(end - 1);
            if (next.selection) {
                --end;
                break;
            }
        }
        let remap, mapFrom;
        if (preserveItems) {
            remap = this.remapping(end, this.items.length);
            mapFrom = remap.maps.length;
        }
        let transform = state.tr;
        let selection, remaining;
        let addAfter = [], addBefore = [];
        this.items.forEach((item, i) => {
            if (!item.step) {
                if (!remap) {
                    remap = this.remapping(end, i + 1);
                    mapFrom = remap.maps.length;
                }
                mapFrom--;
                addBefore.push(item);
                return;
            }
            if (remap) {
                addBefore.push(new Item(item.map));
                let step = item.step.map(remap.slice(mapFrom)), map;
                if (step && transform.maybeStep(step).doc) {
                    map = transform.mapping.maps[transform.mapping.maps.length - 1];
                    addAfter.push(new Item(map, undefined, undefined, addAfter.length + addBefore.length));
                }
                mapFrom--;
                if (map)
                    remap.appendMap(map, mapFrom);
            }
            else {
                transform.maybeStep(item.step);
            }
            if (item.selection) {
                selection = remap ? item.selection.map(remap.slice(mapFrom)) : item.selection;
                remaining = new Branch(this.items.slice(0, end).append(addBefore.reverse().concat(addAfter)), this.eventCount - 1);
                return false;
            }
        }, this.items.length, 0);
        return { remaining: remaining, transform, selection: selection };
    }
    // Create a new branch with the given transform added.
    addTransform(transform, selection, histOptions, preserveItems) {
        let newItems = [], eventCount = this.eventCount;
        let oldItems = this.items, lastItem = !preserveItems && oldItems.length ? oldItems.get(oldItems.length - 1) : null;
        for (let i = 0; i < transform.steps.length; i++) {
            let step = transform.steps[i].invert(transform.docs[i]);
            let item = new Item(transform.mapping.maps[i], step, selection), merged;
            if (merged = lastItem && lastItem.merge(item)) {
                item = merged;
                if (i)
                    newItems.pop();
                else
                    oldItems = oldItems.slice(0, oldItems.length - 1);
            }
            newItems.push(item);
            if (selection) {
                eventCount++;
                selection = undefined;
            }
            if (!preserveItems)
                lastItem = item;
        }
        let overflow = eventCount - histOptions.depth;
        if (overflow > DEPTH_OVERFLOW) {
            oldItems = cutOffEvents(oldItems, overflow);
            eventCount -= overflow;
        }
        return new Branch(oldItems.append(newItems), eventCount);
    }
    remapping(from, to) {
        let maps = new Mapping;
        this.items.forEach((item, i) => {
            let mirrorPos = item.mirrorOffset != null && i - item.mirrorOffset >= from
                ? maps.maps.length - item.mirrorOffset : undefined;
            maps.appendMap(item.map, mirrorPos);
        }, from, to);
        return maps;
    }
    addMaps(array) {
        if (this.eventCount == 0)
            return this;
        return new Branch(this.items.append(array.map(map => new Item(map))), this.eventCount);
    }
    // When the collab module receives remote changes, the history has
    // to know about those, so that it can adjust the steps that were
    // rebased on top of the remote changes, and include the position
    // maps for the remote changes in its array of items.
    rebased(rebasedTransform, rebasedCount) {
        if (!this.eventCount)
            return this;
        let rebasedItems = [], start = Math.max(0, this.items.length - rebasedCount);
        let mapping = rebasedTransform.mapping;
        let newUntil = rebasedTransform.steps.length;
        let eventCount = this.eventCount;
        this.items.forEach(item => { if (item.selection)
            eventCount--; }, start);
        let iRebased = rebasedCount;
        this.items.forEach(item => {
            let pos = mapping.getMirror(--iRebased);
            if (pos == null)
                return;
            newUntil = Math.min(newUntil, pos);
            let map = mapping.maps[pos];
            if (item.step) {
                let step = rebasedTransform.steps[pos].invert(rebasedTransform.docs[pos]);
                let selection = item.selection && item.selection.map(mapping.slice(iRebased + 1, pos));
                if (selection)
                    eventCount++;
                rebasedItems.push(new Item(map, step, selection));
            }
            else {
                rebasedItems.push(new Item(map));
            }
        }, start);
        let newMaps = [];
        for (let i = rebasedCount; i < newUntil; i++)
            newMaps.push(new Item(mapping.maps[i]));
        let items = this.items.slice(0, start).append(newMaps).append(rebasedItems);
        let branch = new Branch(items, eventCount);
        if (branch.emptyItemCount() > max_empty_items)
            branch = branch.compress(this.items.length - rebasedItems.length);
        return branch;
    }
    emptyItemCount() {
        let count = 0;
        this.items.forEach(item => { if (!item.step)
            count++; });
        return count;
    }
    // Compressing a branch means rewriting it to push the air (map-only
    // items) out. During collaboration, these naturally accumulate
    // because each remote change adds one. The `upto` argument is used
    // to ensure that only the items below a given level are compressed,
    // because `rebased` relies on a clean, untouched set of items in
    // order to associate old items with rebased steps.
    compress(upto = this.items.length) {
        let remap = this.remapping(0, upto), mapFrom = remap.maps.length;
        let items = [], events = 0;
        this.items.forEach((item, i) => {
            if (i >= upto) {
                items.push(item);
                if (item.selection)
                    events++;
            }
            else if (item.step) {
                let step = item.step.map(remap.slice(mapFrom)), map = step && step.getMap();
                mapFrom--;
                if (map)
                    remap.appendMap(map, mapFrom);
                if (step) {
                    let selection = item.selection && item.selection.map(remap.slice(mapFrom));
                    if (selection)
                        events++;
                    let newItem = new Item(map.invert(), step, selection), merged, last = items.length - 1;
                    if (merged = items.length && items[last].merge(newItem))
                        items[last] = merged;
                    else
                        items.push(newItem);
                }
            }
            else if (item.map) {
                mapFrom--;
            }
        }, this.items.length, 0);
        return new Branch(RopeSequence.from(items.reverse()), events);
    }
}
Branch.empty = new Branch(RopeSequence.empty, 0);
function cutOffEvents(items, n) {
    let cutPoint;
    items.forEach((item, i) => {
        if (item.selection && (n-- == 0)) {
            cutPoint = i;
            return false;
        }
    });
    return items.slice(cutPoint);
}
class Item {
    constructor(
    // The (forward) step map for this item.
    map, 
    // The inverted step
    step, 
    // If this is non-null, this item is the start of a group, and
    // this selection is the starting selection for the group (the one
    // that was active before the first step was applied)
    selection, 
    // If this item is the inverse of a previous mapping on the stack,
    // this points at the inverse's offset
    mirrorOffset) {
        this.map = map;
        this.step = step;
        this.selection = selection;
        this.mirrorOffset = mirrorOffset;
    }
    merge(other) {
        if (this.step && other.step && !other.selection) {
            let step = other.step.merge(this.step);
            if (step)
                return new Item(step.getMap().invert(), step, this.selection);
        }
    }
}
// The value of the state field that tracks undo/redo history for that
// state. Will be stored in the plugin state when the history plugin
// is active.
class HistoryState {
    constructor(done, undone, prevRanges, prevTime, prevComposition) {
        this.done = done;
        this.undone = undone;
        this.prevRanges = prevRanges;
        this.prevTime = prevTime;
        this.prevComposition = prevComposition;
    }
}
const DEPTH_OVERFLOW = 20;
// Record a transformation in undo history.
function applyTransaction(history, state, tr, options) {
    let historyTr = tr.getMeta(historyKey), rebased;
    if (historyTr)
        return historyTr.historyState;
    if (tr.getMeta(closeHistoryKey))
        history = new HistoryState(history.done, history.undone, null, 0, -1);
    let appended = tr.getMeta("appendedTransaction");
    if (tr.steps.length == 0) {
        return history;
    }
    else if (appended && appended.getMeta(historyKey)) {
        if (appended.getMeta(historyKey).redo)
            return new HistoryState(history.done.addTransform(tr, undefined, options, mustPreserveItems(state)), history.undone, rangesFor(tr.mapping.maps[tr.steps.length - 1]), history.prevTime, history.prevComposition);
        else
            return new HistoryState(history.done, history.undone.addTransform(tr, undefined, options, mustPreserveItems(state)), null, history.prevTime, history.prevComposition);
    }
    else if (tr.getMeta("addToHistory") !== false && !(appended && appended.getMeta("addToHistory") === false)) {
        // Group transforms that occur in quick succession into one event.
        let composition = tr.getMeta("composition");
        let newGroup = history.prevTime == 0 ||
            (!appended && history.prevComposition != composition &&
                (history.prevTime < (tr.time || 0) - options.newGroupDelay || !isAdjacentTo(tr, history.prevRanges)));
        let prevRanges = appended ? mapRanges(history.prevRanges, tr.mapping) : rangesFor(tr.mapping.maps[tr.steps.length - 1]);
        return new HistoryState(history.done.addTransform(tr, newGroup ? state.selection.getBookmark() : undefined, options, mustPreserveItems(state)), Branch.empty, prevRanges, tr.time, composition == null ? history.prevComposition : composition);
    }
    else if (rebased = tr.getMeta("rebased")) {
        // Used by the collab module to tell the history that some of its
        // content has been rebased.
        return new HistoryState(history.done.rebased(tr, rebased), history.undone.rebased(tr, rebased), mapRanges(history.prevRanges, tr.mapping), history.prevTime, history.prevComposition);
    }
    else {
        return new HistoryState(history.done.addMaps(tr.mapping.maps), history.undone.addMaps(tr.mapping.maps), mapRanges(history.prevRanges, tr.mapping), history.prevTime, history.prevComposition);
    }
}
function isAdjacentTo(transform, prevRanges) {
    if (!prevRanges)
        return false;
    if (!transform.docChanged)
        return true;
    let adjacent = false;
    transform.mapping.maps[0].forEach((start, end) => {
        for (let i = 0; i < prevRanges.length; i += 2)
            if (start <= prevRanges[i + 1] && end >= prevRanges[i])
                adjacent = true;
    });
    return adjacent;
}
function rangesFor(map) {
    let result = [];
    map.forEach((_from, _to, from, to) => result.push(from, to));
    return result;
}
function mapRanges(ranges, mapping) {
    if (!ranges)
        return null;
    let result = [];
    for (let i = 0; i < ranges.length; i += 2) {
        let from = mapping.map(ranges[i], 1), to = mapping.map(ranges[i + 1], -1);
        if (from <= to)
            result.push(from, to);
    }
    return result;
}
// Apply the latest event from one branch to the document and shift the event
// onto the other branch.
function histTransaction(history, state, redo) {
    let preserveItems = mustPreserveItems(state);
    let histOptions = historyKey.get(state).spec.config;
    let pop = (redo ? history.undone : history.done).popEvent(state, preserveItems);
    if (!pop)
        return null;
    let selection = pop.selection.resolve(pop.transform.doc);
    let added = (redo ? history.done : history.undone).addTransform(pop.transform, state.selection.getBookmark(), histOptions, preserveItems);
    let newHist = new HistoryState(redo ? added : pop.remaining, redo ? pop.remaining : added, null, 0, -1);
    return pop.transform.setSelection(selection).setMeta(historyKey, { redo, historyState: newHist });
}
let cachedPreserveItems = false, cachedPreserveItemsPlugins = null;
// Check whether any plugin in the given state has a
// `historyPreserveItems` property in its spec, in which case we must
// preserve steps exactly as they came in, so that they can be
// rebased.
function mustPreserveItems(state) {
    let plugins = state.plugins;
    if (cachedPreserveItemsPlugins != plugins) {
        cachedPreserveItems = false;
        cachedPreserveItemsPlugins = plugins;
        for (let i = 0; i < plugins.length; i++)
            if (plugins[i].spec.historyPreserveItems) {
                cachedPreserveItems = true;
                break;
            }
    }
    return cachedPreserveItems;
}
const historyKey = new PluginKey("history");
const closeHistoryKey = new PluginKey("closeHistory");
/**
Returns a plugin that enables the undo history for an editor. The
plugin will track undo and redo stacks, which can be used with the
[`undo`](https://prosemirror.net/docs/ref/#history.undo) and [`redo`](https://prosemirror.net/docs/ref/#history.redo) commands.

You can set an `"addToHistory"` [metadata
property](https://prosemirror.net/docs/ref/#state.Transaction.setMeta) of `false` on a transaction
to prevent it from being rolled back by undo.
*/
function history(config = {}) {
    config = { depth: config.depth || 100,
        newGroupDelay: config.newGroupDelay || 500 };
    return new Plugin({
        key: historyKey,
        state: {
            init() {
                return new HistoryState(Branch.empty, Branch.empty, null, 0, -1);
            },
            apply(tr, hist, state) {
                return applyTransaction(hist, state, tr, config);
            }
        },
        config,
        props: {
            handleDOMEvents: {
                beforeinput(view, e) {
                    let inputType = e.inputType;
                    let command = inputType == "historyUndo" ? undo : inputType == "historyRedo" ? redo : null;
                    if (!command)
                        return false;
                    e.preventDefault();
                    return command(view.state, view.dispatch);
                }
            }
        }
    });
}
function buildCommand(redo, scroll) {
    return (state, dispatch) => {
        let hist = historyKey.getState(state);
        if (!hist || (redo ? hist.undone : hist.done).eventCount == 0)
            return false;
        if (dispatch) {
            let tr = histTransaction(hist, state, redo);
            if (tr)
                dispatch(scroll ? tr.scrollIntoView() : tr);
        }
        return true;
    };
}
/**
A command function that undoes the last change, if any.
*/
const undo = buildCommand(false, true);
/**
A command function that redoes the last undone change, if any.
*/
const redo = buildCommand(true, true);

/**
Delete the selection, if there is one.
*/
const deleteSelection = (state, dispatch) => {
    if (state.selection.empty)
        return false;
    if (dispatch)
        dispatch(state.tr.deleteSelection().scrollIntoView());
    return true;
};
function atBlockStart(state, view) {
    let { $cursor } = state.selection;
    if (!$cursor || (view ? !view.endOfTextblock("backward", state)
        : $cursor.parentOffset > 0))
        return null;
    return $cursor;
}
/**
If the selection is empty and at the start of a textblock, try to
reduce the distance between that block and the one before it—if
there's a block directly before it that can be joined, join them.
If not, try to move the selected block closer to the next one in
the document structure by lifting it out of its parent or moving it
into a parent of the previous block. Will use the view for accurate
(bidi-aware) start-of-textblock detection if given.
*/
const joinBackward = (state, dispatch, view) => {
    let $cursor = atBlockStart(state, view);
    if (!$cursor)
        return false;
    let $cut = findCutBefore($cursor);
    // If there is no node before this, try to lift
    if (!$cut) {
        let range = $cursor.blockRange(), target = range && liftTarget(range);
        if (target == null)
            return false;
        if (dispatch)
            dispatch(state.tr.lift(range, target).scrollIntoView());
        return true;
    }
    let before = $cut.nodeBefore;
    // Apply the joining algorithm
    if (!before.type.spec.isolating && deleteBarrier(state, $cut, dispatch))
        return true;
    // If the node below has no content and the node above is
    // selectable, delete the node below and select the one above.
    if ($cursor.parent.content.size == 0 &&
        (textblockAt(before, "end") || NodeSelection.isSelectable(before))) {
        let delStep = replaceStep(state.doc, $cursor.before(), $cursor.after(), Slice.empty);
        if (delStep && delStep.slice.size < delStep.to - delStep.from) {
            if (dispatch) {
                let tr = state.tr.step(delStep);
                tr.setSelection(textblockAt(before, "end") ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos, -1)), -1)
                    : NodeSelection.create(tr.doc, $cut.pos - before.nodeSize));
                dispatch(tr.scrollIntoView());
            }
            return true;
        }
    }
    // If the node before is an atom, delete it
    if (before.isAtom && $cut.depth == $cursor.depth - 1) {
        if (dispatch)
            dispatch(state.tr.delete($cut.pos - before.nodeSize, $cut.pos).scrollIntoView());
        return true;
    }
    return false;
};
function textblockAt(node, side, only = false) {
    for (let scan = node; scan; scan = (side == "start" ? scan.firstChild : scan.lastChild)) {
        if (scan.isTextblock)
            return true;
        if (only && scan.childCount != 1)
            return false;
    }
    return false;
}
/**
When the selection is empty and at the start of a textblock, select
the node before that textblock, if possible. This is intended to be
bound to keys like backspace, after
[`joinBackward`](https://prosemirror.net/docs/ref/#commands.joinBackward) or other deleting
commands, as a fall-back behavior when the schema doesn't allow
deletion at the selected point.
*/
const selectNodeBackward = (state, dispatch, view) => {
    let { $head, empty } = state.selection, $cut = $head;
    if (!empty)
        return false;
    if ($head.parent.isTextblock) {
        if (view ? !view.endOfTextblock("backward", state) : $head.parentOffset > 0)
            return false;
        $cut = findCutBefore($head);
    }
    let node = $cut && $cut.nodeBefore;
    if (!node || !NodeSelection.isSelectable(node))
        return false;
    if (dispatch)
        dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos - node.nodeSize)).scrollIntoView());
    return true;
};
function findCutBefore($pos) {
    if (!$pos.parent.type.spec.isolating)
        for (let i = $pos.depth - 1; i >= 0; i--) {
            if ($pos.index(i) > 0)
                return $pos.doc.resolve($pos.before(i + 1));
            if ($pos.node(i).type.spec.isolating)
                break;
        }
    return null;
}
function atBlockEnd(state, view) {
    let { $cursor } = state.selection;
    if (!$cursor || (view ? !view.endOfTextblock("forward", state)
        : $cursor.parentOffset < $cursor.parent.content.size))
        return null;
    return $cursor;
}
/**
If the selection is empty and the cursor is at the end of a
textblock, try to reduce or remove the boundary between that block
and the one after it, either by joining them or by moving the other
block closer to this one in the tree structure. Will use the view
for accurate start-of-textblock detection if given.
*/
const joinForward = (state, dispatch, view) => {
    let $cursor = atBlockEnd(state, view);
    if (!$cursor)
        return false;
    let $cut = findCutAfter($cursor);
    // If there is no node after this, there's nothing to do
    if (!$cut)
        return false;
    let after = $cut.nodeAfter;
    // Try the joining algorithm
    if (deleteBarrier(state, $cut, dispatch))
        return true;
    // If the node above has no content and the node below is
    // selectable, delete the node above and select the one below.
    if ($cursor.parent.content.size == 0 &&
        (textblockAt(after, "start") || NodeSelection.isSelectable(after))) {
        let delStep = replaceStep(state.doc, $cursor.before(), $cursor.after(), Slice.empty);
        if (delStep && delStep.slice.size < delStep.to - delStep.from) {
            if (dispatch) {
                let tr = state.tr.step(delStep);
                tr.setSelection(textblockAt(after, "start") ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos)), 1)
                    : NodeSelection.create(tr.doc, tr.mapping.map($cut.pos)));
                dispatch(tr.scrollIntoView());
            }
            return true;
        }
    }
    // If the next node is an atom, delete it
    if (after.isAtom && $cut.depth == $cursor.depth - 1) {
        if (dispatch)
            dispatch(state.tr.delete($cut.pos, $cut.pos + after.nodeSize).scrollIntoView());
        return true;
    }
    return false;
};
/**
When the selection is empty and at the end of a textblock, select
the node coming after that textblock, if possible. This is intended
to be bound to keys like delete, after
[`joinForward`](https://prosemirror.net/docs/ref/#commands.joinForward) and similar deleting
commands, to provide a fall-back behavior when the schema doesn't
allow deletion at the selected point.
*/
const selectNodeForward = (state, dispatch, view) => {
    let { $head, empty } = state.selection, $cut = $head;
    if (!empty)
        return false;
    if ($head.parent.isTextblock) {
        if (view ? !view.endOfTextblock("forward", state) : $head.parentOffset < $head.parent.content.size)
            return false;
        $cut = findCutAfter($head);
    }
    let node = $cut && $cut.nodeAfter;
    if (!node || !NodeSelection.isSelectable(node))
        return false;
    if (dispatch)
        dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos)).scrollIntoView());
    return true;
};
function findCutAfter($pos) {
    if (!$pos.parent.type.spec.isolating)
        for (let i = $pos.depth - 1; i >= 0; i--) {
            let parent = $pos.node(i);
            if ($pos.index(i) + 1 < parent.childCount)
                return $pos.doc.resolve($pos.after(i + 1));
            if (parent.type.spec.isolating)
                break;
        }
    return null;
}
/**
Join the selected block or, if there is a text selection, the
closest ancestor block of the selection that can be joined, with
the sibling above it.
*/
const joinUp = (state, dispatch) => {
    let sel = state.selection, nodeSel = sel instanceof NodeSelection, point;
    if (nodeSel) {
        if (sel.node.isTextblock || !canJoin(state.doc, sel.from))
            return false;
        point = sel.from;
    }
    else {
        point = joinPoint(state.doc, sel.from, -1);
        if (point == null)
            return false;
    }
    if (dispatch) {
        let tr = state.tr.join(point);
        if (nodeSel)
            tr.setSelection(NodeSelection.create(tr.doc, point - state.doc.resolve(point).nodeBefore.nodeSize));
        dispatch(tr.scrollIntoView());
    }
    return true;
};
/**
Join the selected block, or the closest ancestor of the selection
that can be joined, with the sibling after it.
*/
const joinDown = (state, dispatch) => {
    let sel = state.selection, point;
    if (sel instanceof NodeSelection) {
        if (sel.node.isTextblock || !canJoin(state.doc, sel.to))
            return false;
        point = sel.to;
    }
    else {
        point = joinPoint(state.doc, sel.to, 1);
        if (point == null)
            return false;
    }
    if (dispatch)
        dispatch(state.tr.join(point).scrollIntoView());
    return true;
};
/**
Lift the selected block, or the closest ancestor block of the
selection that can be lifted, out of its parent node.
*/
const lift = (state, dispatch) => {
    let { $from, $to } = state.selection;
    let range = $from.blockRange($to), target = range && liftTarget(range);
    if (target == null)
        return false;
    if (dispatch)
        dispatch(state.tr.lift(range, target).scrollIntoView());
    return true;
};
/**
If the selection is in a node whose type has a truthy
[`code`](https://prosemirror.net/docs/ref/#model.NodeSpec.code) property in its spec, replace the
selection with a newline character.
*/
const newlineInCode = (state, dispatch) => {
    let { $head, $anchor } = state.selection;
    if (!$head.parent.type.spec.code || !$head.sameParent($anchor))
        return false;
    if (dispatch)
        dispatch(state.tr.insertText("\n").scrollIntoView());
    return true;
};
function defaultBlockAt(match) {
    for (let i = 0; i < match.edgeCount; i++) {
        let { type } = match.edge(i);
        if (type.isTextblock && !type.hasRequiredAttrs())
            return type;
    }
    return null;
}
/**
When the selection is in a node with a truthy
[`code`](https://prosemirror.net/docs/ref/#model.NodeSpec.code) property in its spec, create a
default block after the code block, and move the cursor there.
*/
const exitCode = (state, dispatch) => {
    let { $head, $anchor } = state.selection;
    if (!$head.parent.type.spec.code || !$head.sameParent($anchor))
        return false;
    let above = $head.node(-1), after = $head.indexAfter(-1), type = defaultBlockAt(above.contentMatchAt(after));
    if (!type || !above.canReplaceWith(after, after, type))
        return false;
    if (dispatch) {
        let pos = $head.after(), tr = state.tr.replaceWith(pos, pos, type.createAndFill());
        tr.setSelection(Selection.near(tr.doc.resolve(pos), 1));
        dispatch(tr.scrollIntoView());
    }
    return true;
};
/**
If a block node is selected, create an empty paragraph before (if
it is its parent's first child) or after it.
*/
const createParagraphNear = (state, dispatch) => {
    let sel = state.selection, { $from, $to } = sel;
    if (sel instanceof AllSelection || $from.parent.inlineContent || $to.parent.inlineContent)
        return false;
    let type = defaultBlockAt($to.parent.contentMatchAt($to.indexAfter()));
    if (!type || !type.isTextblock)
        return false;
    if (dispatch) {
        let side = (!$from.parentOffset && $to.index() < $to.parent.childCount ? $from : $to).pos;
        let tr = state.tr.insert(side, type.createAndFill());
        tr.setSelection(TextSelection.create(tr.doc, side + 1));
        dispatch(tr.scrollIntoView());
    }
    return true;
};
/**
If the cursor is in an empty textblock that can be lifted, lift the
block.
*/
const liftEmptyBlock = (state, dispatch) => {
    let { $cursor } = state.selection;
    if (!$cursor || $cursor.parent.content.size)
        return false;
    if ($cursor.depth > 1 && $cursor.after() != $cursor.end(-1)) {
        let before = $cursor.before();
        if (canSplit(state.doc, before)) {
            if (dispatch)
                dispatch(state.tr.split(before).scrollIntoView());
            return true;
        }
    }
    let range = $cursor.blockRange(), target = range && liftTarget(range);
    if (target == null)
        return false;
    if (dispatch)
        dispatch(state.tr.lift(range, target).scrollIntoView());
    return true;
};
/**
Create a variant of [`splitBlock`](https://prosemirror.net/docs/ref/#commands.splitBlock) that uses
a custom function to determine the type of the newly split off block.
*/
function splitBlockAs(splitNode) {
    return (state, dispatch) => {
        let { $from, $to } = state.selection;
        if (state.selection instanceof NodeSelection && state.selection.node.isBlock) {
            if (!$from.parentOffset || !canSplit(state.doc, $from.pos))
                return false;
            if (dispatch)
                dispatch(state.tr.split($from.pos).scrollIntoView());
            return true;
        }
        if (!$from.parent.isBlock)
            return false;
        if (dispatch) {
            let atEnd = $to.parentOffset == $to.parent.content.size;
            let tr = state.tr;
            if (state.selection instanceof TextSelection || state.selection instanceof AllSelection)
                tr.deleteSelection();
            let deflt = $from.depth == 0 ? null : defaultBlockAt($from.node(-1).contentMatchAt($from.indexAfter(-1)));
            let splitType = splitNode && splitNode($to.parent, atEnd);
            let types = splitType ? [splitType] : atEnd && deflt ? [{ type: deflt }] : undefined;
            let can = canSplit(tr.doc, tr.mapping.map($from.pos), 1, types);
            if (!types && !can && canSplit(tr.doc, tr.mapping.map($from.pos), 1, deflt ? [{ type: deflt }] : undefined)) {
                if (deflt)
                    types = [{ type: deflt }];
                can = true;
            }
            if (can) {
                tr.split(tr.mapping.map($from.pos), 1, types);
                if (!atEnd && !$from.parentOffset && $from.parent.type != deflt) {
                    let first = tr.mapping.map($from.before()), $first = tr.doc.resolve(first);
                    if (deflt && $from.node(-1).canReplaceWith($first.index(), $first.index() + 1, deflt))
                        tr.setNodeMarkup(tr.mapping.map($from.before()), deflt);
                }
            }
            dispatch(tr.scrollIntoView());
        }
        return true;
    };
}
/**
Split the parent block of the selection. If the selection is a text
selection, also delete its content.
*/
const splitBlock = splitBlockAs();
/**
Move the selection to the node wrapping the current selection, if
any. (Will not select the document node.)
*/
const selectParentNode = (state, dispatch) => {
    let { $from, to } = state.selection, pos;
    let same = $from.sharedDepth(to);
    if (same == 0)
        return false;
    pos = $from.before(same);
    if (dispatch)
        dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos)));
    return true;
};
/**
Select the whole document.
*/
const selectAll = (state, dispatch) => {
    if (dispatch)
        dispatch(state.tr.setSelection(new AllSelection(state.doc)));
    return true;
};
function joinMaybeClear(state, $pos, dispatch) {
    let before = $pos.nodeBefore, after = $pos.nodeAfter, index = $pos.index();
    if (!before || !after || !before.type.compatibleContent(after.type))
        return false;
    if (!before.content.size && $pos.parent.canReplace(index - 1, index)) {
        if (dispatch)
            dispatch(state.tr.delete($pos.pos - before.nodeSize, $pos.pos).scrollIntoView());
        return true;
    }
    if (!$pos.parent.canReplace(index, index + 1) || !(after.isTextblock || canJoin(state.doc, $pos.pos)))
        return false;
    if (dispatch)
        dispatch(state.tr
            .clearIncompatible($pos.pos, before.type, before.contentMatchAt(before.childCount))
            .join($pos.pos)
            .scrollIntoView());
    return true;
}
function deleteBarrier(state, $cut, dispatch) {
    let before = $cut.nodeBefore, after = $cut.nodeAfter, conn, match;
    if (before.type.spec.isolating || after.type.spec.isolating)
        return false;
    if (joinMaybeClear(state, $cut, dispatch))
        return true;
    let canDelAfter = $cut.parent.canReplace($cut.index(), $cut.index() + 1);
    if (canDelAfter &&
        (conn = (match = before.contentMatchAt(before.childCount)).findWrapping(after.type)) &&
        match.matchType(conn[0] || after.type).validEnd) {
        if (dispatch) {
            let end = $cut.pos + after.nodeSize, wrap = Fragment.empty;
            for (let i = conn.length - 1; i >= 0; i--)
                wrap = Fragment.from(conn[i].create(null, wrap));
            wrap = Fragment.from(before.copy(wrap));
            let tr = state.tr.step(new ReplaceAroundStep($cut.pos - 1, end, $cut.pos, end, new Slice(wrap, 1, 0), conn.length, true));
            let joinAt = end + 2 * conn.length;
            if (canJoin(tr.doc, joinAt))
                tr.join(joinAt);
            dispatch(tr.scrollIntoView());
        }
        return true;
    }
    let selAfter = Selection.findFrom($cut, 1);
    let range = selAfter && selAfter.$from.blockRange(selAfter.$to), target = range && liftTarget(range);
    if (target != null && target >= $cut.depth) {
        if (dispatch)
            dispatch(state.tr.lift(range, target).scrollIntoView());
        return true;
    }
    if (canDelAfter && textblockAt(after, "start", true) && textblockAt(before, "end")) {
        let at = before, wrap = [];
        for (;;) {
            wrap.push(at);
            if (at.isTextblock)
                break;
            at = at.lastChild;
        }
        let afterText = after, afterDepth = 1;
        for (; !afterText.isTextblock; afterText = afterText.firstChild)
            afterDepth++;
        if (at.canReplace(at.childCount, at.childCount, afterText.content)) {
            if (dispatch) {
                let end = Fragment.empty;
                for (let i = wrap.length - 1; i >= 0; i--)
                    end = Fragment.from(wrap[i].copy(end));
                let tr = state.tr.step(new ReplaceAroundStep($cut.pos - wrap.length, $cut.pos + after.nodeSize, $cut.pos + afterDepth, $cut.pos + after.nodeSize - afterDepth, new Slice(end, wrap.length, 0), 0, true));
                dispatch(tr.scrollIntoView());
            }
            return true;
        }
    }
    return false;
}
function selectTextblockSide(side) {
    return function (state, dispatch) {
        let sel = state.selection, $pos = side < 0 ? sel.$from : sel.$to;
        let depth = $pos.depth;
        while ($pos.node(depth).isInline) {
            if (!depth)
                return false;
            depth--;
        }
        if (!$pos.node(depth).isTextblock)
            return false;
        if (dispatch)
            dispatch(state.tr.setSelection(TextSelection.create(state.doc, side < 0 ? $pos.start(depth) : $pos.end(depth))));
        return true;
    };
}
/**
Moves the cursor to the start of current text block.
*/
const selectTextblockStart = selectTextblockSide(-1);
/**
Moves the cursor to the end of current text block.
*/
const selectTextblockEnd = selectTextblockSide(1);
// Parameterized commands
/**
Wrap the selection in a node of the given type with the given
attributes.
*/
function wrapIn(nodeType, attrs = null) {
    return function (state, dispatch) {
        let { $from, $to } = state.selection;
        let range = $from.blockRange($to), wrapping = range && findWrapping(range, nodeType, attrs);
        if (!wrapping)
            return false;
        if (dispatch)
            dispatch(state.tr.wrap(range, wrapping).scrollIntoView());
        return true;
    };
}
/**
Returns a command that tries to set the selected textblocks to the
given node type with the given attributes.
*/
function setBlockType(nodeType, attrs = null) {
    return function (state, dispatch) {
        let applicable = false;
        for (let i = 0; i < state.selection.ranges.length && !applicable; i++) {
            let { $from: { pos: from }, $to: { pos: to } } = state.selection.ranges[i];
            state.doc.nodesBetween(from, to, (node, pos) => {
                if (applicable)
                    return false;
                if (!node.isTextblock || node.hasMarkup(nodeType, attrs))
                    return;
                if (node.type == nodeType) {
                    applicable = true;
                }
                else {
                    let $pos = state.doc.resolve(pos), index = $pos.index();
                    applicable = $pos.parent.canReplaceWith(index, index + 1, nodeType);
                }
            });
        }
        if (!applicable)
            return false;
        if (dispatch) {
            let tr = state.tr;
            for (let i = 0; i < state.selection.ranges.length; i++) {
                let { $from: { pos: from }, $to: { pos: to } } = state.selection.ranges[i];
                tr.setBlockType(from, to, nodeType, attrs);
            }
            dispatch(tr.scrollIntoView());
        }
        return true;
    };
}
function markApplies(doc, ranges, type) {
    for (let i = 0; i < ranges.length; i++) {
        let { $from, $to } = ranges[i];
        let can = $from.depth == 0 ? doc.inlineContent && doc.type.allowsMarkType(type) : false;
        doc.nodesBetween($from.pos, $to.pos, node => {
            if (can)
                return false;
            can = node.inlineContent && node.type.allowsMarkType(type);
        });
        if (can)
            return true;
    }
    return false;
}
/**
Create a command function that toggles the given mark with the
given attributes. Will return `false` when the current selection
doesn't support that mark. This will remove the mark if any marks
of that type exist in the selection, or add it otherwise. If the
selection is empty, this applies to the [stored
marks](https://prosemirror.net/docs/ref/#state.EditorState.storedMarks) instead of a range of the
document.
*/
function toggleMark(markType, attrs = null) {
    return function (state, dispatch) {
        let { empty, $cursor, ranges } = state.selection;
        if ((empty && !$cursor) || !markApplies(state.doc, ranges, markType))
            return false;
        if (dispatch) {
            if ($cursor) {
                if (markType.isInSet(state.storedMarks || $cursor.marks()))
                    dispatch(state.tr.removeStoredMark(markType));
                else
                    dispatch(state.tr.addStoredMark(markType.create(attrs)));
            }
            else {
                let has = false, tr = state.tr;
                for (let i = 0; !has && i < ranges.length; i++) {
                    let { $from, $to } = ranges[i];
                    has = state.doc.rangeHasMark($from.pos, $to.pos, markType);
                }
                for (let i = 0; i < ranges.length; i++) {
                    let { $from, $to } = ranges[i];
                    if (has) {
                        tr.removeMark($from.pos, $to.pos, markType);
                    }
                    else {
                        let from = $from.pos, to = $to.pos, start = $from.nodeAfter, end = $to.nodeBefore;
                        let spaceStart = start && start.isText ? /^\s*/.exec(start.text)[0].length : 0;
                        let spaceEnd = end && end.isText ? /\s*$/.exec(end.text)[0].length : 0;
                        if (from + spaceStart < to) {
                            from += spaceStart;
                            to -= spaceEnd;
                        }
                        tr.addMark(from, to, markType.create(attrs));
                    }
                }
                dispatch(tr.scrollIntoView());
            }
        }
        return true;
    };
}
/**
Combine a number of command functions into a single function (which
calls them one by one until one returns true).
*/
function chainCommands(...commands) {
    return function (state, dispatch, view) {
        for (let i = 0; i < commands.length; i++)
            if (commands[i](state, dispatch, view))
                return true;
        return false;
    };
}
let backspace = chainCommands(deleteSelection, joinBackward, selectNodeBackward);
let del = chainCommands(deleteSelection, joinForward, selectNodeForward);
/**
A basic keymap containing bindings not specific to any schema.
Binds the following keys (when multiple commands are listed, they
are chained with [`chainCommands`](https://prosemirror.net/docs/ref/#commands.chainCommands)):

* **Enter** to `newlineInCode`, `createParagraphNear`, `liftEmptyBlock`, `splitBlock`
* **Mod-Enter** to `exitCode`
* **Backspace** and **Mod-Backspace** to `deleteSelection`, `joinBackward`, `selectNodeBackward`
* **Delete** and **Mod-Delete** to `deleteSelection`, `joinForward`, `selectNodeForward`
* **Mod-Delete** to `deleteSelection`, `joinForward`, `selectNodeForward`
* **Mod-a** to `selectAll`
*/
const pcBaseKeymap = {
    "Enter": chainCommands(newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock),
    "Mod-Enter": exitCode,
    "Backspace": backspace,
    "Mod-Backspace": backspace,
    "Shift-Backspace": backspace,
    "Delete": del,
    "Mod-Delete": del,
    "Mod-a": selectAll
};
/**
A copy of `pcBaseKeymap` that also binds **Ctrl-h** like Backspace,
**Ctrl-d** like Delete, **Alt-Backspace** like Ctrl-Backspace, and
**Ctrl-Alt-Backspace**, **Alt-Delete**, and **Alt-d** like
Ctrl-Delete.
*/
const macBaseKeymap = {
    "Ctrl-h": pcBaseKeymap["Backspace"],
    "Alt-Backspace": pcBaseKeymap["Mod-Backspace"],
    "Ctrl-d": pcBaseKeymap["Delete"],
    "Ctrl-Alt-Backspace": pcBaseKeymap["Mod-Delete"],
    "Alt-Delete": pcBaseKeymap["Mod-Delete"],
    "Alt-d": pcBaseKeymap["Mod-Delete"],
    "Ctrl-a": selectTextblockStart,
    "Ctrl-e": selectTextblockEnd
};
for (let key in pcBaseKeymap)
    macBaseKeymap[key] = pcBaseKeymap[key];
const mac$2 = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform)
    // @ts-ignore
    : typeof os != "undefined" && os.platform ? os.platform() == "darwin" : false;
/**
Depending on the detected platform, this will hold
[`pcBasekeymap`](https://prosemirror.net/docs/ref/#commands.pcBaseKeymap) or
[`macBaseKeymap`](https://prosemirror.net/docs/ref/#commands.macBaseKeymap).
*/
const baseKeymap = mac$2 ? macBaseKeymap : pcBaseKeymap;

/**
Create a plugin that, when added to a ProseMirror instance,
causes a decoration to show up at the drop position when something
is dragged over the editor.

Nodes may add a `disableDropCursor` property to their spec to
control the showing of a drop cursor inside them. This may be a
boolean or a function, which will be called with a view and a
position, and should return a boolean.
*/
function dropCursor(options = {}) {
    return new Plugin({
        view(editorView) { return new DropCursorView(editorView, options); }
    });
}
class DropCursorView {
    constructor(editorView, options) {
        var _a;
        this.editorView = editorView;
        this.cursorPos = null;
        this.element = null;
        this.timeout = -1;
        this.width = (_a = options.width) !== null && _a !== void 0 ? _a : 1;
        this.color = options.color === false ? undefined : (options.color || "black");
        this.class = options.class;
        this.handlers = ["dragover", "dragend", "drop", "dragleave"].map(name => {
            let handler = (e) => { this[name](e); };
            editorView.dom.addEventListener(name, handler);
            return { name, handler };
        });
    }
    destroy() {
        this.handlers.forEach(({ name, handler }) => this.editorView.dom.removeEventListener(name, handler));
    }
    update(editorView, prevState) {
        if (this.cursorPos != null && prevState.doc != editorView.state.doc) {
            if (this.cursorPos > editorView.state.doc.content.size)
                this.setCursor(null);
            else
                this.updateOverlay();
        }
    }
    setCursor(pos) {
        if (pos == this.cursorPos)
            return;
        this.cursorPos = pos;
        if (pos == null) {
            this.element.parentNode.removeChild(this.element);
            this.element = null;
        }
        else {
            this.updateOverlay();
        }
    }
    updateOverlay() {
        let $pos = this.editorView.state.doc.resolve(this.cursorPos);
        let isBlock = !$pos.parent.inlineContent, rect;
        if (isBlock) {
            let before = $pos.nodeBefore, after = $pos.nodeAfter;
            if (before || after) {
                let node = this.editorView.nodeDOM(this.cursorPos - (before ? before.nodeSize : 0));
                if (node) {
                    let nodeRect = node.getBoundingClientRect();
                    let top = before ? nodeRect.bottom : nodeRect.top;
                    if (before && after)
                        top = (top + this.editorView.nodeDOM(this.cursorPos).getBoundingClientRect().top) / 2;
                    rect = { left: nodeRect.left, right: nodeRect.right, top: top - this.width / 2, bottom: top + this.width / 2 };
                }
            }
        }
        if (!rect) {
            let coords = this.editorView.coordsAtPos(this.cursorPos);
            rect = { left: coords.left - this.width / 2, right: coords.left + this.width / 2, top: coords.top, bottom: coords.bottom };
        }
        let parent = this.editorView.dom.offsetParent;
        if (!this.element) {
            this.element = parent.appendChild(document.createElement("div"));
            if (this.class)
                this.element.className = this.class;
            this.element.style.cssText = "position: absolute; z-index: 50; pointer-events: none;";
            if (this.color) {
                this.element.style.backgroundColor = this.color;
            }
        }
        this.element.classList.toggle("prosemirror-dropcursor-block", isBlock);
        this.element.classList.toggle("prosemirror-dropcursor-inline", !isBlock);
        let parentLeft, parentTop;
        if (!parent || parent == document.body && getComputedStyle(parent).position == "static") {
            parentLeft = -pageXOffset;
            parentTop = -pageYOffset;
        }
        else {
            let rect = parent.getBoundingClientRect();
            parentLeft = rect.left - parent.scrollLeft;
            parentTop = rect.top - parent.scrollTop;
        }
        this.element.style.left = (rect.left - parentLeft) + "px";
        this.element.style.top = (rect.top - parentTop) + "px";
        this.element.style.width = (rect.right - rect.left) + "px";
        this.element.style.height = (rect.bottom - rect.top) + "px";
    }
    scheduleRemoval(timeout) {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.setCursor(null), timeout);
    }
    dragover(event) {
        if (!this.editorView.editable)
            return;
        let pos = this.editorView.posAtCoords({ left: event.clientX, top: event.clientY });
        let node = pos && pos.inside >= 0 && this.editorView.state.doc.nodeAt(pos.inside);
        let disableDropCursor = node && node.type.spec.disableDropCursor;
        let disabled = typeof disableDropCursor == "function" ? disableDropCursor(this.editorView, pos, event) : disableDropCursor;
        if (pos && !disabled) {
            let target = pos.pos;
            if (this.editorView.dragging && this.editorView.dragging.slice) {
                let point = dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice);
                if (point != null)
                    target = point;
            }
            this.setCursor(target);
            this.scheduleRemoval(5000);
        }
    }
    dragend() {
        this.scheduleRemoval(20);
    }
    drop() {
        this.scheduleRemoval(20);
    }
    dragleave(event) {
        if (event.target == this.editorView.dom || !this.editorView.dom.contains(event.relatedTarget))
            this.setCursor(null);
    }
}

/**
Gap cursor selections are represented using this class. Its
`$anchor` and `$head` properties both point at the cursor position.
*/
class GapCursor extends Selection {
    /**
    Create a gap cursor.
    */
    constructor($pos) {
        super($pos, $pos);
    }
    map(doc, mapping) {
        let $pos = doc.resolve(mapping.map(this.head));
        return GapCursor.valid($pos) ? new GapCursor($pos) : Selection.near($pos);
    }
    content() { return Slice.empty; }
    eq(other) {
        return other instanceof GapCursor && other.head == this.head;
    }
    toJSON() {
        return { type: "gapcursor", pos: this.head };
    }
    /**
    @internal
    */
    static fromJSON(doc, json) {
        if (typeof json.pos != "number")
            throw new RangeError("Invalid input for GapCursor.fromJSON");
        return new GapCursor(doc.resolve(json.pos));
    }
    /**
    @internal
    */
    getBookmark() { return new GapBookmark(this.anchor); }
    /**
    @internal
    */
    static valid($pos) {
        let parent = $pos.parent;
        if (parent.isTextblock || !closedBefore($pos) || !closedAfter($pos))
            return false;
        let override = parent.type.spec.allowGapCursor;
        if (override != null)
            return override;
        let deflt = parent.contentMatchAt($pos.index()).defaultType;
        return deflt && deflt.isTextblock;
    }
    /**
    @internal
    */
    static findGapCursorFrom($pos, dir, mustMove = false) {
        search: for (;;) {
            if (!mustMove && GapCursor.valid($pos))
                return $pos;
            let pos = $pos.pos, next = null;
            // Scan up from this position
            for (let d = $pos.depth;; d--) {
                let parent = $pos.node(d);
                if (dir > 0 ? $pos.indexAfter(d) < parent.childCount : $pos.index(d) > 0) {
                    next = parent.child(dir > 0 ? $pos.indexAfter(d) : $pos.index(d) - 1);
                    break;
                }
                else if (d == 0) {
                    return null;
                }
                pos += dir;
                let $cur = $pos.doc.resolve(pos);
                if (GapCursor.valid($cur))
                    return $cur;
            }
            // And then down into the next node
            for (;;) {
                let inside = dir > 0 ? next.firstChild : next.lastChild;
                if (!inside) {
                    if (next.isAtom && !next.isText && !NodeSelection.isSelectable(next)) {
                        $pos = $pos.doc.resolve(pos + next.nodeSize * dir);
                        mustMove = false;
                        continue search;
                    }
                    break;
                }
                next = inside;
                pos += dir;
                let $cur = $pos.doc.resolve(pos);
                if (GapCursor.valid($cur))
                    return $cur;
            }
            return null;
        }
    }
}
GapCursor.prototype.visible = false;
GapCursor.findFrom = GapCursor.findGapCursorFrom;
Selection.jsonID("gapcursor", GapCursor);
class GapBookmark {
    constructor(pos) {
        this.pos = pos;
    }
    map(mapping) {
        return new GapBookmark(mapping.map(this.pos));
    }
    resolve(doc) {
        let $pos = doc.resolve(this.pos);
        return GapCursor.valid($pos) ? new GapCursor($pos) : Selection.near($pos);
    }
}
function closedBefore($pos) {
    for (let d = $pos.depth; d >= 0; d--) {
        let index = $pos.index(d), parent = $pos.node(d);
        // At the start of this parent, look at next one
        if (index == 0) {
            if (parent.type.spec.isolating)
                return true;
            continue;
        }
        // See if the node before (or its first ancestor) is closed
        for (let before = parent.child(index - 1);; before = before.lastChild) {
            if ((before.childCount == 0 && !before.inlineContent) || before.isAtom || before.type.spec.isolating)
                return true;
            if (before.inlineContent)
                return false;
        }
    }
    // Hit start of document
    return true;
}
function closedAfter($pos) {
    for (let d = $pos.depth; d >= 0; d--) {
        let index = $pos.indexAfter(d), parent = $pos.node(d);
        if (index == parent.childCount) {
            if (parent.type.spec.isolating)
                return true;
            continue;
        }
        for (let after = parent.child(index);; after = after.firstChild) {
            if ((after.childCount == 0 && !after.inlineContent) || after.isAtom || after.type.spec.isolating)
                return true;
            if (after.inlineContent)
                return false;
        }
    }
    return true;
}

/**
Create a gap cursor plugin. When enabled, this will capture clicks
near and arrow-key-motion past places that don't have a normally
selectable position nearby, and create a gap cursor selection for
them. The cursor is drawn as an element with class
`ProseMirror-gapcursor`. You can either include
`style/gapcursor.css` from the package's directory or add your own
styles to make it visible.
*/
function gapCursor() {
    return new Plugin({
        props: {
            decorations: drawGapCursor,
            createSelectionBetween(_view, $anchor, $head) {
                return $anchor.pos == $head.pos && GapCursor.valid($head) ? new GapCursor($head) : null;
            },
            handleClick,
            handleKeyDown,
            handleDOMEvents: { beforeinput: beforeinput }
        }
    });
}
const handleKeyDown = keydownHandler({
    "ArrowLeft": arrow("horiz", -1),
    "ArrowRight": arrow("horiz", 1),
    "ArrowUp": arrow("vert", -1),
    "ArrowDown": arrow("vert", 1)
});
function arrow(axis, dir) {
    const dirStr = axis == "vert" ? (dir > 0 ? "down" : "up") : (dir > 0 ? "right" : "left");
    return function (state, dispatch, view) {
        let sel = state.selection;
        let $start = dir > 0 ? sel.$to : sel.$from, mustMove = sel.empty;
        if (sel instanceof TextSelection) {
            if (!view.endOfTextblock(dirStr) || $start.depth == 0)
                return false;
            mustMove = false;
            $start = state.doc.resolve(dir > 0 ? $start.after() : $start.before());
        }
        let $found = GapCursor.findGapCursorFrom($start, dir, mustMove);
        if (!$found)
            return false;
        if (dispatch)
            dispatch(state.tr.setSelection(new GapCursor($found)));
        return true;
    };
}
function handleClick(view, pos, event) {
    if (!view || !view.editable)
        return false;
    let $pos = view.state.doc.resolve(pos);
    if (!GapCursor.valid($pos))
        return false;
    let clickPos = view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (clickPos && clickPos.inside > -1 && NodeSelection.isSelectable(view.state.doc.nodeAt(clickPos.inside)))
        return false;
    view.dispatch(view.state.tr.setSelection(new GapCursor($pos)));
    return true;
}
// This is a hack that, when a composition starts while a gap cursor
// is active, quickly creates an inline context for the composition to
// happen in, to avoid it being aborted by the DOM selection being
// moved into a valid position.
function beforeinput(view, event) {
    if (event.inputType != "insertCompositionText" || !(view.state.selection instanceof GapCursor))
        return false;
    let { $from } = view.state.selection;
    let insert = $from.parent.contentMatchAt($from.index()).findWrapping(view.state.schema.nodes.text);
    if (!insert)
        return false;
    let frag = Fragment.empty;
    for (let i = insert.length - 1; i >= 0; i--)
        frag = Fragment.from(insert[i].createAndFill(null, frag));
    let tr = view.state.tr.replace($from.pos, $from.pos, new Slice(frag, 0, 0));
    tr.setSelection(TextSelection.near(tr.doc.resolve($from.pos + 1)));
    view.dispatch(tr);
    return false;
}
function drawGapCursor(state) {
    if (!(state.selection instanceof GapCursor))
        return null;
    let node = document.createElement("div");
    node.className = "ProseMirror-gapcursor";
    return DecorationSet.create(state.doc, [Decoration.widget(state.selection.head, node, { key: "gapcursor" })]);
}

function crelt() {
  var elt = arguments[0];
  if (typeof elt == "string") elt = document.createElement(elt);
  var i = 1, next = arguments[1];
  if (next && typeof next == "object" && next.nodeType == null && !Array.isArray(next)) {
    for (var name in next) if (Object.prototype.hasOwnProperty.call(next, name)) {
      var value = next[name];
      if (typeof value == "string") elt.setAttribute(name, value);
      else if (value != null) elt[name] = value;
    }
    i++;
  }
  for (; i < arguments.length; i++) add(elt, arguments[i]);
  return elt
}

function add(elt, child) {
  if (typeof child == "string") {
    elt.appendChild(document.createTextNode(child));
  } else if (child == null) ; else if (child.nodeType != null) {
    elt.appendChild(child);
  } else if (Array.isArray(child)) {
    for (var i = 0; i < child.length; i++) add(elt, child[i]);
  } else {
    throw new RangeError("Unsupported child node: " + child)
  }
}

const SVG = "http://www.w3.org/2000/svg";
const XLINK = "http://www.w3.org/1999/xlink";
const prefix$2 = "ProseMirror-icon";
function hashPath(path) {
    let hash = 0;
    for (let i = 0; i < path.length; i++)
        hash = (((hash << 5) - hash) + path.charCodeAt(i)) | 0;
    return hash;
}
function getIcon(root, icon) {
    let doc = (root.nodeType == 9 ? root : root.ownerDocument) || document;
    let node = doc.createElement("div");
    node.className = prefix$2;
    if (icon.path) {
        let { path, width, height } = icon;
        let name = "pm-icon-" + hashPath(path).toString(16);
        if (!doc.getElementById(name))
            buildSVG(root, name, icon);
        let svg = node.appendChild(doc.createElementNS(SVG, "svg"));
        svg.style.width = (width / height) + "em";
        let use = svg.appendChild(doc.createElementNS(SVG, "use"));
        use.setAttributeNS(XLINK, "href", /([^#]*)/.exec(doc.location.toString())[1] + "#" + name);
    }
    else if (icon.dom) {
        node.appendChild(icon.dom.cloneNode(true));
    }
    else {
        let { text, css } = icon;
        node.appendChild(doc.createElement("span")).textContent = text || '';
        if (css)
            node.firstChild.style.cssText = css;
    }
    return node;
}
function buildSVG(root, name, data) {
    let [doc, top] = root.nodeType == 9 ? [root, root.body] : [root.ownerDocument || document, root];
    let collection = doc.getElementById(prefix$2 + "-collection");
    if (!collection) {
        collection = doc.createElementNS(SVG, "svg");
        collection.id = prefix$2 + "-collection";
        collection.style.display = "none";
        top.insertBefore(collection, top.firstChild);
    }
    let sym = doc.createElementNS(SVG, "symbol");
    sym.id = name;
    sym.setAttribute("viewBox", "0 0 " + data.width + " " + data.height);
    let path = sym.appendChild(doc.createElementNS(SVG, "path"));
    path.setAttribute("d", data.path);
    collection.appendChild(sym);
}

const prefix$1 = "ProseMirror-menu";
/**
An icon or label that, when clicked, executes a command.
*/
class MenuItem {
    /**
    Create a menu item.
    */
    constructor(
    /**
    The spec used to create this item.
    */
    spec) {
        this.spec = spec;
    }
    /**
    Renders the icon according to its [display
    spec](https://prosemirror.net/docs/ref/#menu.MenuItemSpec.display), and adds an event handler which
    executes the command when the representation is clicked.
    */
    render(view) {
        let spec = this.spec;
        let dom = spec.render ? spec.render(view)
            : spec.icon ? getIcon(view.root, spec.icon)
                : spec.label ? crelt("div", null, translate(view, spec.label))
                    : null;
        if (!dom)
            throw new RangeError("MenuItem without icon or label property");
        if (spec.title) {
            const title = (typeof spec.title === "function" ? spec.title(view.state) : spec.title);
            dom.setAttribute("title", translate(view, title));
        }
        if (spec.class)
            dom.classList.add(spec.class);
        if (spec.css)
            dom.style.cssText += spec.css;
        dom.addEventListener("mousedown", e => {
            e.preventDefault();
            if (!dom.classList.contains(prefix$1 + "-disabled"))
                spec.run(view.state, view.dispatch, view, e);
        });
        function update(state) {
            if (spec.select) {
                let selected = spec.select(state);
                dom.style.display = selected ? "" : "none";
                if (!selected)
                    return false;
            }
            let enabled = true;
            if (spec.enable) {
                enabled = spec.enable(state) || false;
                setClass(dom, prefix$1 + "-disabled", !enabled);
            }
            if (spec.active) {
                let active = enabled && spec.active(state) || false;
                setClass(dom, prefix$1 + "-active", active);
            }
            return true;
        }
        return { dom, update };
    }
}
function translate(view, text) {
    return view._props.translate ? view._props.translate(text) : text;
}
let lastMenuEvent = { time: 0, node: null };
function markMenuEvent(e) {
    lastMenuEvent.time = Date.now();
    lastMenuEvent.node = e.target;
}
function isMenuEvent(wrapper) {
    return Date.now() - 100 < lastMenuEvent.time &&
        lastMenuEvent.node && wrapper.contains(lastMenuEvent.node);
}
/**
A drop-down menu, displayed as a label with a downwards-pointing
triangle to the right of it.
*/
class Dropdown {
    /**
    Create a dropdown wrapping the elements.
    */
    constructor(content, 
    /**
    @internal
    */
    options = {}) {
        this.options = options;
        this.options = options || {};
        this.content = Array.isArray(content) ? content : [content];
    }
    /**
    Render the dropdown menu and sub-items.
    */
    render(view) {
        let content = renderDropdownItems(this.content, view);
        let win = view.dom.ownerDocument.defaultView || window;
        let label = crelt("div", { class: prefix$1 + "-dropdown " + (this.options.class || ""),
            style: this.options.css }, translate(view, this.options.label || ""));
        if (this.options.title)
            label.setAttribute("title", translate(view, this.options.title));
        let wrap = crelt("div", { class: prefix$1 + "-dropdown-wrap" }, label);
        let open = null;
        let listeningOnClose = null;
        let close = () => {
            if (open && open.close()) {
                open = null;
                win.removeEventListener("mousedown", listeningOnClose);
            }
        };
        label.addEventListener("mousedown", e => {
            e.preventDefault();
            markMenuEvent(e);
            if (open) {
                close();
            }
            else {
                open = this.expand(wrap, content.dom);
                win.addEventListener("mousedown", listeningOnClose = () => {
                    if (!isMenuEvent(wrap))
                        close();
                });
            }
        });
        function update(state) {
            let inner = content.update(state);
            wrap.style.display = inner ? "" : "none";
            return inner;
        }
        return { dom: wrap, update };
    }
    /**
    @internal
    */
    expand(dom, items) {
        let menuDOM = crelt("div", { class: prefix$1 + "-dropdown-menu " + (this.options.class || "") }, items);
        let done = false;
        function close() {
            if (done)
                return false;
            done = true;
            dom.removeChild(menuDOM);
            return true;
        }
        dom.appendChild(menuDOM);
        return { close, node: menuDOM };
    }
}
function renderDropdownItems(items, view) {
    let rendered = [], updates = [];
    for (let i = 0; i < items.length; i++) {
        let { dom, update } = items[i].render(view);
        rendered.push(crelt("div", { class: prefix$1 + "-dropdown-item" }, dom));
        updates.push(update);
    }
    return { dom: rendered, update: combineUpdates(updates, rendered) };
}
function combineUpdates(updates, nodes) {
    return (state) => {
        let something = false;
        for (let i = 0; i < updates.length; i++) {
            let up = updates[i](state);
            nodes[i].style.display = up ? "" : "none";
            if (up)
                something = true;
        }
        return something;
    };
}
/**
Represents a submenu wrapping a group of elements that start
hidden and expand to the right when hovered over or tapped.
*/
class DropdownSubmenu {
    /**
    Creates a submenu for the given group of menu elements. The
    following options are recognized:
    */
    constructor(content, 
    /**
    @internal
    */
    options = {}) {
        this.options = options;
        this.content = Array.isArray(content) ? content : [content];
    }
    /**
    Renders the submenu.
    */
    render(view) {
        let items = renderDropdownItems(this.content, view);
        let win = view.dom.ownerDocument.defaultView || window;
        let label = crelt("div", { class: prefix$1 + "-submenu-label" }, translate(view, this.options.label || ""));
        let wrap = crelt("div", { class: prefix$1 + "-submenu-wrap" }, label, crelt("div", { class: prefix$1 + "-submenu" }, items.dom));
        let listeningOnClose = null;
        label.addEventListener("mousedown", e => {
            e.preventDefault();
            markMenuEvent(e);
            setClass(wrap, prefix$1 + "-submenu-wrap-active", false);
            if (!listeningOnClose)
                win.addEventListener("mousedown", listeningOnClose = () => {
                    if (!isMenuEvent(wrap)) {
                        wrap.classList.remove(prefix$1 + "-submenu-wrap-active");
                        win.removeEventListener("mousedown", listeningOnClose);
                        listeningOnClose = null;
                    }
                });
        });
        function update(state) {
            let inner = items.update(state);
            wrap.style.display = inner ? "" : "none";
            return inner;
        }
        return { dom: wrap, update };
    }
}
/**
Render the given, possibly nested, array of menu elements into a
document fragment, placing separators between them (and ensuring no
superfluous separators appear when some of the groups turn out to
be empty).
*/
function renderGrouped(view, content) {
    let result = document.createDocumentFragment();
    let updates = [], separators = [];
    for (let i = 0; i < content.length; i++) {
        let items = content[i], localUpdates = [], localNodes = [];
        for (let j = 0; j < items.length; j++) {
            let { dom, update } = items[j].render(view);
            let span = crelt("span", { class: prefix$1 + "item" }, dom);
            result.appendChild(span);
            localNodes.push(span);
            localUpdates.push(update);
        }
        if (localUpdates.length) {
            updates.push(combineUpdates(localUpdates, localNodes));
            if (i < content.length - 1)
                separators.push(result.appendChild(separator()));
        }
    }
    function update(state) {
        let something = false, needSep = false;
        for (let i = 0; i < updates.length; i++) {
            let hasContent = updates[i](state);
            if (i)
                separators[i - 1].style.display = needSep && hasContent ? "" : "none";
            needSep = hasContent;
            if (hasContent)
                something = true;
        }
        return something;
    }
    return { dom: result, update };
}
function separator() {
    return crelt("span", { class: prefix$1 + "separator" });
}
/**
A set of basic editor-related icons. Contains the properties
`join`, `lift`, `selectParentNode`, `undo`, `redo`, `strong`, `em`,
`code`, `link`, `bulletList`, `orderedList`, and `blockquote`, each
holding an object that can be used as the `icon` option to
`MenuItem`.
*/
const icons = {
    join: {
        width: 800, height: 900,
        path: "M0 75h800v125h-800z M0 825h800v-125h-800z M250 400h100v-100h100v100h100v100h-100v100h-100v-100h-100z"
    },
    lift: {
        width: 1024, height: 1024,
        path: "M219 310v329q0 7-5 12t-12 5q-8 0-13-5l-164-164q-5-5-5-13t5-13l164-164q5-5 13-5 7 0 12 5t5 12zM1024 749v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12zM1024 530v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 310v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 91v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12z"
    },
    selectParentNode: { text: "\u2b1a", css: "font-weight: bold" },
    undo: {
        width: 1024, height: 1024,
        path: "M761 1024c113-206 132-520-313-509v253l-384-384 384-384v248c534-13 594 472 313 775z"
    },
    redo: {
        width: 1024, height: 1024,
        path: "M576 248v-248l384 384-384 384v-253c-446-10-427 303-313 509-280-303-221-789 313-775z"
    },
    strong: {
        width: 805, height: 1024,
        path: "M317 869q42 18 80 18 214 0 214-191 0-65-23-102-15-25-35-42t-38-26-46-14-48-6-54-1q-41 0-57 5 0 30-0 90t-0 90q0 4-0 38t-0 55 2 47 6 38zM309 442q24 4 62 4 46 0 81-7t62-25 42-51 14-81q0-40-16-70t-45-46-61-24-70-8q-28 0-74 7 0 28 2 86t2 86q0 15-0 45t-0 45q0 26 0 39zM0 950l1-53q8-2 48-9t60-15q4-6 7-15t4-19 3-18 1-21 0-19v-37q0-561-12-585-2-4-12-8t-25-6-28-4-27-2-17-1l-2-47q56-1 194-6t213-5q13 0 39 0t38 0q40 0 78 7t73 24 61 40 42 59 16 78q0 29-9 54t-22 41-36 32-41 25-48 22q88 20 146 76t58 141q0 57-20 102t-53 74-78 48-93 27-100 8q-25 0-75-1t-75-1q-60 0-175 6t-132 6z"
    },
    em: {
        width: 585, height: 1024,
        path: "M0 949l9-48q3-1 46-12t63-21q16-20 23-57 0-4 35-165t65-310 29-169v-14q-13-7-31-10t-39-4-33-3l10-58q18 1 68 3t85 4 68 1q27 0 56-1t69-4 56-3q-2 22-10 50-17 5-58 16t-62 19q-4 10-8 24t-5 22-4 26-3 24q-15 84-50 239t-44 203q-1 5-7 33t-11 51-9 47-3 32l0 10q9 2 105 17-1 25-9 56-6 0-18 0t-18 0q-16 0-49-5t-49-5q-78-1-117-1-29 0-81 5t-69 6z"
    },
    code: {
        width: 896, height: 1024,
        path: "M608 192l-96 96 224 224-224 224 96 96 288-320-288-320zM288 192l-288 320 288 320 96-96-224-224 224-224-96-96z"
    },
    link: {
        width: 951, height: 1024,
        path: "M832 694q0-22-16-38l-118-118q-16-16-38-16-24 0-41 18 1 1 10 10t12 12 8 10 7 14 2 15q0 22-16 38t-38 16q-8 0-15-2t-14-7-10-8-12-12-10-10q-18 17-18 41 0 22 16 38l117 118q15 15 38 15 22 0 38-14l84-83q16-16 16-38zM430 292q0-22-16-38l-117-118q-16-16-38-16-22 0-38 15l-84 83q-16 16-16 38 0 22 16 38l118 118q15 15 38 15 24 0 41-17-1-1-10-10t-12-12-8-10-7-14-2-15q0-22 16-38t38-16q8 0 15 2t14 7 10 8 12 12 10 10q18-17 18-41zM941 694q0 68-48 116l-84 83q-47 47-116 47-69 0-116-48l-117-118q-47-47-47-116 0-70 50-119l-50-50q-49 50-118 50-68 0-116-48l-118-118q-48-48-48-116t48-116l84-83q47-47 116-47 69 0 116 48l117 118q47 47 47 116 0 70-50 119l50 50q49-50 118-50 68 0 116 48l118 118q48 48 48 116z"
    },
    bulletList: {
        width: 768, height: 896,
        path: "M0 512h128v-128h-128v128zM0 256h128v-128h-128v128zM0 768h128v-128h-128v128zM256 512h512v-128h-512v128zM256 256h512v-128h-512v128zM256 768h512v-128h-512v128z"
    },
    orderedList: {
        width: 768, height: 896,
        path: "M320 512h448v-128h-448v128zM320 768h448v-128h-448v128zM320 128v128h448v-128h-448zM79 384h78v-256h-36l-85 23v50l43-2v185zM189 590c0-36-12-78-96-78-33 0-64 6-83 16l1 66c21-10 42-15 67-15s32 11 32 28c0 26-30 58-110 112v50h192v-67l-91 2c49-30 87-66 87-113l1-1z"
    },
    blockquote: {
        width: 640, height: 896,
        path: "M0 448v256h256v-256h-128c0 0 0-128 128-128v-128c0 0-256 0-256 256zM640 320v-128c0 0-256 0-256 256v256h256v-256h-128c0 0 0-128 128-128z"
    }
};
/**
Menu item for the `joinUp` command.
*/
const joinUpItem = new MenuItem({
    title: "Join with above block",
    run: joinUp,
    select: state => joinUp(state),
    icon: icons.join
});
/**
Menu item for the `lift` command.
*/
const liftItem = new MenuItem({
    title: "Lift out of enclosing block",
    run: lift,
    select: state => lift(state),
    icon: icons.lift
});
/**
Menu item for the `selectParentNode` command.
*/
const selectParentNodeItem = new MenuItem({
    title: "Select parent node",
    run: selectParentNode,
    select: state => selectParentNode(state),
    icon: icons.selectParentNode
});
/**
Menu item for the `undo` command.
*/
let undoItem = new MenuItem({
    title: "Undo last change",
    run: undo,
    enable: state => undo(state),
    icon: icons.undo
});
/**
Menu item for the `redo` command.
*/
let redoItem = new MenuItem({
    title: "Redo last undone change",
    run: redo,
    enable: state => redo(state),
    icon: icons.redo
});
/**
Build a menu item for wrapping the selection in a given node type.
Adds `run` and `select` properties to the ones present in
`options`. `options.attrs` may be an object that provides
attributes for the wrapping node.
*/
function wrapItem(nodeType, options) {
    let passedOptions = {
        run(state, dispatch) {
            return wrapIn(nodeType, options.attrs)(state, dispatch);
        },
        select(state) {
            return wrapIn(nodeType, options.attrs)(state);
        }
    };
    for (let prop in options)
        passedOptions[prop] = options[prop];
    return new MenuItem(passedOptions);
}
/**
Build a menu item for changing the type of the textblock around the
selection to the given type. Provides `run`, `active`, and `select`
properties. Others must be given in `options`. `options.attrs` may
be an object to provide the attributes for the textblock node.
*/
function blockTypeItem(nodeType, options) {
    let command = setBlockType(nodeType, options.attrs);
    let passedOptions = {
        run: command,
        enable(state) { return command(state); },
        active(state) {
            let { $from, to, node } = state.selection;
            if (node)
                return node.hasMarkup(nodeType, options.attrs);
            return to <= $from.end() && $from.parent.hasMarkup(nodeType, options.attrs);
        }
    };
    for (let prop in options)
        passedOptions[prop] = options[prop];
    return new MenuItem(passedOptions);
}
// Work around classList.toggle being broken in IE11
function setClass(dom, cls, on) {
    if (on)
        dom.classList.add(cls);
    else
        dom.classList.remove(cls);
}

const prefix = "ProseMirror-menubar";
function isIOS() {
    if (typeof navigator == "undefined")
        return false;
    let agent = navigator.userAgent;
    return !/Edge\/\d/.test(agent) && /AppleWebKit/.test(agent) && /Mobile\/\w+/.test(agent);
}
/**
A plugin that will place a menu bar above the editor. Note that
this involves wrapping the editor in an additional `<div>`.
*/
function menuBar(options) {
    return new Plugin({
        view(editorView) { return new MenuBarView(editorView, options); }
    });
}
class MenuBarView {
    constructor(editorView, options) {
        this.editorView = editorView;
        this.options = options;
        this.spacer = null;
        this.maxHeight = 0;
        this.widthForMaxHeight = 0;
        this.floating = false;
        this.scrollHandler = null;
        this.wrapper = crelt("div", { class: prefix + "-wrapper" });
        this.menu = this.wrapper.appendChild(crelt("div", { class: prefix }));
        this.menu.className = prefix;
        if (editorView.dom.parentNode)
            editorView.dom.parentNode.replaceChild(this.wrapper, editorView.dom);
        this.wrapper.appendChild(editorView.dom);
        let { dom, update } = renderGrouped(this.editorView, this.options.content);
        this.contentUpdate = update;
        this.menu.appendChild(dom);
        this.update();
        if (options.floating && !isIOS()) {
            this.updateFloat();
            let potentialScrollers = getAllWrapping(this.wrapper);
            this.scrollHandler = (e) => {
                let root = this.editorView.root;
                if (!(root.body || root).contains(this.wrapper))
                    potentialScrollers.forEach(el => el.removeEventListener("scroll", this.scrollHandler));
                else
                    this.updateFloat(e.target.getBoundingClientRect ? e.target : undefined);
            };
            potentialScrollers.forEach(el => el.addEventListener('scroll', this.scrollHandler));
        }
    }
    update() {
        this.contentUpdate(this.editorView.state);
        if (this.floating) {
            this.updateScrollCursor();
        }
        else {
            if (this.menu.offsetWidth != this.widthForMaxHeight) {
                this.widthForMaxHeight = this.menu.offsetWidth;
                this.maxHeight = 0;
            }
            if (this.menu.offsetHeight > this.maxHeight) {
                this.maxHeight = this.menu.offsetHeight;
                this.menu.style.minHeight = this.maxHeight + "px";
            }
        }
    }
    updateScrollCursor() {
        let selection = this.editorView.root.getSelection();
        if (!selection.focusNode)
            return;
        let rects = selection.getRangeAt(0).getClientRects();
        let selRect = rects[selectionIsInverted(selection) ? 0 : rects.length - 1];
        if (!selRect)
            return;
        let menuRect = this.menu.getBoundingClientRect();
        if (selRect.top < menuRect.bottom && selRect.bottom > menuRect.top) {
            let scrollable = findWrappingScrollable(this.wrapper);
            if (scrollable)
                scrollable.scrollTop -= (menuRect.bottom - selRect.top);
        }
    }
    updateFloat(scrollAncestor) {
        let parent = this.wrapper, editorRect = parent.getBoundingClientRect(), top = scrollAncestor ? Math.max(0, scrollAncestor.getBoundingClientRect().top) : 0;
        if (this.floating) {
            if (editorRect.top >= top || editorRect.bottom < this.menu.offsetHeight + 10) {
                this.floating = false;
                this.menu.style.position = this.menu.style.left = this.menu.style.top = this.menu.style.width = "";
                this.menu.style.display = "";
                this.spacer.parentNode.removeChild(this.spacer);
                this.spacer = null;
            }
            else {
                let border = (parent.offsetWidth - parent.clientWidth) / 2;
                this.menu.style.left = (editorRect.left + border) + "px";
                this.menu.style.display = editorRect.top > (this.editorView.dom.ownerDocument.defaultView || window).innerHeight
                    ? "none" : "";
                if (scrollAncestor)
                    this.menu.style.top = top + "px";
            }
        }
        else {
            if (editorRect.top < top && editorRect.bottom >= this.menu.offsetHeight + 10) {
                this.floating = true;
                let menuRect = this.menu.getBoundingClientRect();
                this.menu.style.left = menuRect.left + "px";
                this.menu.style.width = menuRect.width + "px";
                if (scrollAncestor)
                    this.menu.style.top = top + "px";
                this.menu.style.position = "fixed";
                this.spacer = crelt("div", { class: prefix + "-spacer", style: `height: ${menuRect.height}px` });
                parent.insertBefore(this.spacer, this.menu);
            }
        }
    }
    destroy() {
        if (this.wrapper.parentNode)
            this.wrapper.parentNode.replaceChild(this.editorView.dom, this.wrapper);
    }
}
// Not precise, but close enough
function selectionIsInverted(selection) {
    if (selection.anchorNode == selection.focusNode)
        return selection.anchorOffset > selection.focusOffset;
    return selection.anchorNode.compareDocumentPosition(selection.focusNode) == Node.DOCUMENT_POSITION_FOLLOWING;
}
function findWrappingScrollable(node) {
    for (let cur = node.parentNode; cur; cur = cur.parentNode)
        if (cur.scrollHeight > cur.clientHeight)
            return cur;
}
function getAllWrapping(node) {
    let res = [node.ownerDocument.defaultView || window];
    for (let cur = node.parentNode; cur; cur = cur.parentNode)
        res.push(cur);
    return res;
}

/**
Returns a command function that wraps the selection in a list with
the given type an attributes. If `dispatch` is null, only return a
value to indicate whether this is possible, but don't actually
perform the change.
*/
function wrapInList(listType, attrs = null) {
    return function (state, dispatch) {
        let { $from, $to } = state.selection;
        let range = $from.blockRange($to), doJoin = false, outerRange = range;
        if (!range)
            return false;
        // This is at the top of an existing list item
        if (range.depth >= 2 && $from.node(range.depth - 1).type.compatibleContent(listType) && range.startIndex == 0) {
            // Don't do anything if this is the top of the list
            if ($from.index(range.depth - 1) == 0)
                return false;
            let $insert = state.doc.resolve(range.start - 2);
            outerRange = new NodeRange($insert, $insert, range.depth);
            if (range.endIndex < range.parent.childCount)
                range = new NodeRange($from, state.doc.resolve($to.end(range.depth)), range.depth);
            doJoin = true;
        }
        let wrap = findWrapping(outerRange, listType, attrs, range);
        if (!wrap)
            return false;
        if (dispatch)
            dispatch(doWrapInList(state.tr, range, wrap, doJoin, listType).scrollIntoView());
        return true;
    };
}
function doWrapInList(tr, range, wrappers, joinBefore, listType) {
    let content = Fragment.empty;
    for (let i = wrappers.length - 1; i >= 0; i--)
        content = Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content));
    tr.step(new ReplaceAroundStep(range.start - (joinBefore ? 2 : 0), range.end, range.start, range.end, new Slice(content, 0, 0), wrappers.length, true));
    let found = 0;
    for (let i = 0; i < wrappers.length; i++)
        if (wrappers[i].type == listType)
            found = i + 1;
    let splitDepth = wrappers.length - found;
    let splitPos = range.start + wrappers.length - (joinBefore ? 2 : 0), parent = range.parent;
    for (let i = range.startIndex, e = range.endIndex, first = true; i < e; i++, first = false) {
        if (!first && canSplit(tr.doc, splitPos, splitDepth)) {
            tr.split(splitPos, splitDepth);
            splitPos += 2 * splitDepth;
        }
        splitPos += parent.child(i).nodeSize;
    }
    return tr;
}
/**
Build a command that splits a non-empty textblock at the top level
of a list item by also splitting that list item.
*/
function splitListItem(itemType, itemAttrs) {
    return function (state, dispatch) {
        let { $from, $to, node } = state.selection;
        if ((node && node.isBlock) || $from.depth < 2 || !$from.sameParent($to))
            return false;
        let grandParent = $from.node(-1);
        if (grandParent.type != itemType)
            return false;
        if ($from.parent.content.size == 0 && $from.node(-1).childCount == $from.indexAfter(-1)) {
            // In an empty block. If this is a nested list, the wrapping
            // list item should be split. Otherwise, bail out and let next
            // command handle lifting.
            if ($from.depth == 3 || $from.node(-3).type != itemType ||
                $from.index(-2) != $from.node(-2).childCount - 1)
                return false;
            if (dispatch) {
                let wrap = Fragment.empty;
                let depthBefore = $from.index(-1) ? 1 : $from.index(-2) ? 2 : 3;
                // Build a fragment containing empty versions of the structure
                // from the outer list item to the parent node of the cursor
                for (let d = $from.depth - depthBefore; d >= $from.depth - 3; d--)
                    wrap = Fragment.from($from.node(d).copy(wrap));
                let depthAfter = $from.indexAfter(-1) < $from.node(-2).childCount ? 1
                    : $from.indexAfter(-2) < $from.node(-3).childCount ? 2 : 3;
                // Add a second list item with an empty default start node
                wrap = wrap.append(Fragment.from(itemType.createAndFill()));
                let start = $from.before($from.depth - (depthBefore - 1));
                let tr = state.tr.replace(start, $from.after(-depthAfter), new Slice(wrap, 4 - depthBefore, 0));
                let sel = -1;
                tr.doc.nodesBetween(start, tr.doc.content.size, (node, pos) => {
                    if (sel > -1)
                        return false;
                    if (node.isTextblock && node.content.size == 0)
                        sel = pos + 1;
                });
                if (sel > -1)
                    tr.setSelection(Selection.near(tr.doc.resolve(sel)));
                dispatch(tr.scrollIntoView());
            }
            return true;
        }
        let nextType = $to.pos == $from.end() ? grandParent.contentMatchAt(0).defaultType : null;
        let tr = state.tr.delete($from.pos, $to.pos);
        let types = nextType ? [itemAttrs ? { type: itemType, attrs: itemAttrs } : null, { type: nextType }] : undefined;
        if (!canSplit(tr.doc, $from.pos, 2, types))
            return false;
        if (dispatch)
            dispatch(tr.split($from.pos, 2, types).scrollIntoView());
        return true;
    };
}
/**
Create a command to lift the list item around the selection up into
a wrapping list.
*/
function liftListItem(itemType) {
    return function (state, dispatch) {
        let { $from, $to } = state.selection;
        let range = $from.blockRange($to, node => node.childCount > 0 && node.firstChild.type == itemType);
        if (!range)
            return false;
        if (!dispatch)
            return true;
        if ($from.node(range.depth - 1).type == itemType) // Inside a parent list
            return liftToOuterList(state, dispatch, itemType, range);
        else // Outer list node
            return liftOutOfList(state, dispatch, range);
    };
}
function liftToOuterList(state, dispatch, itemType, range) {
    let tr = state.tr, end = range.end, endOfList = range.$to.end(range.depth);
    if (end < endOfList) {
        // There are siblings after the lifted items, which must become
        // children of the last item
        tr.step(new ReplaceAroundStep(end - 1, endOfList, end, endOfList, new Slice(Fragment.from(itemType.create(null, range.parent.copy())), 1, 0), 1, true));
        range = new NodeRange(tr.doc.resolve(range.$from.pos), tr.doc.resolve(endOfList), range.depth);
    }
    const target = liftTarget(range);
    if (target == null)
        return false;
    tr.lift(range, target);
    let after = tr.mapping.map(end, -1) - 1;
    if (canJoin(tr.doc, after))
        tr.join(after);
    dispatch(tr.scrollIntoView());
    return true;
}
function liftOutOfList(state, dispatch, range) {
    let tr = state.tr, list = range.parent;
    // Merge the list items into a single big item
    for (let pos = range.end, i = range.endIndex - 1, e = range.startIndex; i > e; i--) {
        pos -= list.child(i).nodeSize;
        tr.delete(pos - 1, pos + 1);
    }
    let $start = tr.doc.resolve(range.start), item = $start.nodeAfter;
    if (tr.mapping.map(range.end) != range.start + $start.nodeAfter.nodeSize)
        return false;
    let atStart = range.startIndex == 0, atEnd = range.endIndex == list.childCount;
    let parent = $start.node(-1), indexBefore = $start.index(-1);
    if (!parent.canReplace(indexBefore + (atStart ? 0 : 1), indexBefore + 1, item.content.append(atEnd ? Fragment.empty : Fragment.from(list))))
        return false;
    let start = $start.pos, end = start + item.nodeSize;
    // Strip off the surrounding list. At the sides where we're not at
    // the end of the list, the existing list is closed. At sides where
    // this is the end, it is overwritten to its end.
    tr.step(new ReplaceAroundStep(start - (atStart ? 1 : 0), end + (atEnd ? 1 : 0), start + 1, end - 1, new Slice((atStart ? Fragment.empty : Fragment.from(list.copy(Fragment.empty)))
        .append(atEnd ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))), atStart ? 0 : 1, atEnd ? 0 : 1), atStart ? 0 : 1));
    dispatch(tr.scrollIntoView());
    return true;
}
/**
Create a command to sink the list item around the selection down
into an inner list.
*/
function sinkListItem(itemType) {
    return function (state, dispatch) {
        let { $from, $to } = state.selection;
        let range = $from.blockRange($to, node => node.childCount > 0 && node.firstChild.type == itemType);
        if (!range)
            return false;
        let startIndex = range.startIndex;
        if (startIndex == 0)
            return false;
        let parent = range.parent, nodeBefore = parent.child(startIndex - 1);
        if (nodeBefore.type != itemType)
            return false;
        if (dispatch) {
            let nestedBefore = nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type;
            let inner = Fragment.from(nestedBefore ? itemType.create() : null);
            let slice = new Slice(Fragment.from(itemType.create(null, Fragment.from(parent.type.create(null, inner)))), nestedBefore ? 3 : 1, 0);
            let before = range.start, after = range.end;
            dispatch(state.tr.step(new ReplaceAroundStep(before - (nestedBefore ? 3 : 1), after, before, after, slice, 1, true))
                .scrollIntoView());
        }
        return true;
    };
}

/**
Input rules are regular expressions describing a piece of text
that, when typed, causes something to happen. This might be
changing two dashes into an emdash, wrapping a paragraph starting
with `"> "` into a blockquote, or something entirely different.
*/
class InputRule {
    // :: (RegExp, union<string, (state: EditorState, match: [string], start: number, end: number) → ?Transaction>)
    /**
    Create an input rule. The rule applies when the user typed
    something and the text directly in front of the cursor matches
    `match`, which should end with `$`.
    
    The `handler` can be a string, in which case the matched text, or
    the first matched group in the regexp, is replaced by that
    string.
    
    Or a it can be a function, which will be called with the match
    array produced by
    [`RegExp.exec`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec),
    as well as the start and end of the matched range, and which can
    return a [transaction](https://prosemirror.net/docs/ref/#state.Transaction) that describes the
    rule's effect, or null to indicate the input was not handled.
    */
    constructor(
    /**
    @internal
    */
    match, handler, options = {}) {
        this.match = match;
        this.match = match;
        this.handler = typeof handler == "string" ? stringHandler(handler) : handler;
        this.undoable = options.undoable !== false;
        this.inCode = options.inCode || false;
    }
}
function stringHandler(string) {
    return function (state, match, start, end) {
        let insert = string;
        if (match[1]) {
            let offset = match[0].lastIndexOf(match[1]);
            insert += match[0].slice(offset + match[1].length);
            start += offset;
            let cutOff = start - end;
            if (cutOff > 0) {
                insert = match[0].slice(offset - cutOff, offset) + insert;
                start = end;
            }
        }
        return state.tr.insertText(insert, start, end);
    };
}
const MAX_MATCH = 500;
/**
Create an input rules plugin. When enabled, it will cause text
input that matches any of the given rules to trigger the rule's
action.
*/
function inputRules({ rules }) {
    let plugin = new Plugin({
        state: {
            init() { return null; },
            apply(tr, prev) {
                let stored = tr.getMeta(this);
                if (stored)
                    return stored;
                return tr.selectionSet || tr.docChanged ? null : prev;
            }
        },
        props: {
            handleTextInput(view, from, to, text) {
                return run(view, from, to, text, rules, plugin);
            },
            handleDOMEvents: {
                compositionend: (view) => {
                    setTimeout(() => {
                        let { $cursor } = view.state.selection;
                        if ($cursor)
                            run(view, $cursor.pos, $cursor.pos, "", rules, plugin);
                    });
                }
            }
        },
        isInputRules: true
    });
    return plugin;
}
function run(view, from, to, text, rules, plugin) {
    if (view.composing)
        return false;
    let state = view.state, $from = state.doc.resolve(from);
    let textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - MAX_MATCH), $from.parentOffset, null, "\ufffc") + text;
    for (let i = 0; i < rules.length; i++) {
        let rule = rules[i];
        if ($from.parent.type.spec.code) {
            if (!rule.inCode)
                continue;
        }
        else if (rule.inCode === "only") {
            continue;
        }
        let match = rule.match.exec(textBefore);
        let tr = match && rule.handler(state, match, from - (match[0].length - text.length), to);
        if (!tr)
            continue;
        if (rule.undoable)
            tr.setMeta(plugin, { transform: tr, from, to, text });
        view.dispatch(tr);
        return true;
    }
    return false;
}
/**
This is a command that will undo an input rule, if applying such a
rule was the last thing that the user did.
*/
const undoInputRule = (state, dispatch) => {
    let plugins = state.plugins;
    for (let i = 0; i < plugins.length; i++) {
        let plugin = plugins[i], undoable;
        if (plugin.spec.isInputRules && (undoable = plugin.getState(state))) {
            if (dispatch) {
                let tr = state.tr, toUndo = undoable.transform;
                for (let j = toUndo.steps.length - 1; j >= 0; j--)
                    tr.step(toUndo.steps[j].invert(toUndo.docs[j]));
                if (undoable.text) {
                    let marks = tr.doc.resolve(undoable.from).marks();
                    tr.replaceWith(undoable.from, undoable.to, state.schema.text(undoable.text, marks));
                }
                else {
                    tr.delete(undoable.from, undoable.to);
                }
                dispatch(tr);
            }
            return true;
        }
    }
    return false;
};

/**
Converts double dashes to an emdash.
*/
const emDash = new InputRule(/--$/, "—");
/**
Converts three dots to an ellipsis character.
*/
const ellipsis = new InputRule(/\.\.\.$/, "…");
/**
“Smart” opening double quotes.
*/
const openDoubleQuote = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, "“");
/**
“Smart” closing double quotes.
*/
const closeDoubleQuote = new InputRule(/"$/, "”");
/**
“Smart” opening single quotes.
*/
const openSingleQuote = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, "‘");
/**
“Smart” closing single quotes.
*/
const closeSingleQuote = new InputRule(/'$/, "’");
/**
Smart-quote related input rules.
*/
const smartQuotes = [openDoubleQuote, closeDoubleQuote, openSingleQuote, closeSingleQuote];

/**
Build an input rule for automatically wrapping a textblock when a
given string is typed. The `regexp` argument is
directly passed through to the `InputRule` constructor. You'll
probably want the regexp to start with `^`, so that the pattern can
only occur at the start of a textblock.

`nodeType` is the type of node to wrap in. If it needs attributes,
you can either pass them directly, or pass a function that will
compute them from the regular expression match.

By default, if there's a node with the same type above the newly
wrapped node, the rule will try to [join](https://prosemirror.net/docs/ref/#transform.Transform.join) those
two nodes. You can pass a join predicate, which takes a regular
expression match and the node before the wrapped node, and can
return a boolean to indicate whether a join should happen.
*/
function wrappingInputRule(regexp, nodeType, getAttrs = null, joinPredicate) {
    return new InputRule(regexp, (state, match, start, end) => {
        let attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
        let tr = state.tr.delete(start, end);
        let $start = tr.doc.resolve(start), range = $start.blockRange(), wrapping = range && findWrapping(range, nodeType, attrs);
        if (!wrapping)
            return null;
        tr.wrap(range, wrapping);
        let before = tr.doc.resolve(start - 1).nodeBefore;
        if (before && before.type == nodeType && canJoin(tr.doc, start - 1) &&
            (!joinPredicate || joinPredicate(match, before)))
            tr.join(start - 1);
        return tr;
    });
}
/**
Build an input rule that changes the type of a textblock when the
matched text is typed into it. You'll usually want to start your
regexp with `^` to that it is only matched at the start of a
textblock. The optional `getAttrs` parameter can be used to compute
the new node's attributes, and works the same as in the
`wrappingInputRule` function.
*/
function textblockTypeInputRule(regexp, nodeType, getAttrs = null) {
    return new InputRule(regexp, (state, match, start, end) => {
        let $start = state.doc.resolve(start);
        let attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
        if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType))
            return null;
        return state.tr
            .delete(start, end)
            .setBlockType(start, start, nodeType, attrs);
    });
}

const prefix$3 = "ProseMirror-prompt";
function openPrompt(options) {
    let wrapper = document.body.appendChild(document.createElement("div"));
    wrapper.className = prefix$3;
    let mouseOutside = (e) => { if (!wrapper.contains(e.target))
        close(); };
    setTimeout(() => window.addEventListener("mousedown", mouseOutside), 50);
    let close = () => {
        window.removeEventListener("mousedown", mouseOutside);
        if (wrapper.parentNode)
            wrapper.parentNode.removeChild(wrapper);
    };
    let domFields = [];
    for (let name in options.fields)
        domFields.push(options.fields[name].render());
    let submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = prefix$3 + "-submit";
    submitButton.textContent = "OK";
    let cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = prefix$3 + "-cancel";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", close);
    let form = wrapper.appendChild(document.createElement("form"));
    if (options.title)
        form.appendChild(document.createElement("h5")).textContent = options.title;
    domFields.forEach(field => {
        form.appendChild(document.createElement("div")).appendChild(field);
    });
    let buttons = form.appendChild(document.createElement("div"));
    buttons.className = prefix$3 + "-buttons";
    buttons.appendChild(submitButton);
    buttons.appendChild(document.createTextNode(" "));
    buttons.appendChild(cancelButton);
    let box = wrapper.getBoundingClientRect();
    wrapper.style.top = ((window.innerHeight - box.height) / 2) + "px";
    wrapper.style.left = ((window.innerWidth - box.width) / 2) + "px";
    let submit = () => {
        let params = getValues(options.fields, domFields);
        if (params) {
            close();
            options.callback(params);
        }
    };
    form.addEventListener("submit", e => {
        e.preventDefault();
        submit();
    });
    form.addEventListener("keydown", e => {
        if (e.keyCode == 27) {
            e.preventDefault();
            close();
        }
        else if (e.keyCode == 13 && !(e.ctrlKey || e.metaKey || e.shiftKey)) {
            e.preventDefault();
            submit();
        }
        else if (e.keyCode == 9) {
            window.setTimeout(() => {
                if (!wrapper.contains(document.activeElement))
                    close();
            }, 500);
        }
    });
    let input = form.elements[0];
    if (input)
        input.focus();
}
function getValues(fields, domFields) {
    let result = Object.create(null), i = 0;
    for (let name in fields) {
        let field = fields[name], dom = domFields[i++];
        let value = field.read(dom), bad = field.validate(value);
        if (bad) {
            reportInvalid(dom, bad);
            return null;
        }
        result[name] = field.clean(value);
    }
    return result;
}
function reportInvalid(dom, message) {
    // FIXME this is awful and needs a lot more work
    let parent = dom.parentNode;
    let msg = parent.appendChild(document.createElement("div"));
    msg.style.left = (dom.offsetLeft + dom.offsetWidth + 2) + "px";
    msg.style.top = (dom.offsetTop - 5) + "px";
    msg.className = "ProseMirror-invalid";
    msg.textContent = message;
    setTimeout(() => parent.removeChild(msg), 1500);
}
/**
The type of field that `openPrompt` expects to be passed to it.
*/
class Field {
    /**
    Create a field with the given options. Options support by all
    field types are:
    */
    constructor(
    /**
    @internal
    */
    options) {
        this.options = options;
    }
    /**
    Read the field's value from its DOM node.
    */
    read(dom) { return dom.value; }
    /**
    A field-type-specific validation function.
    */
    validateType(value) { return null; }
    /**
    @internal
    */
    validate(value) {
        if (!value && this.options.required)
            return "Required field";
        return this.validateType(value) || (this.options.validate ? this.options.validate(value) : null);
    }
    clean(value) {
        return this.options.clean ? this.options.clean(value) : value;
    }
}
/**
A field class for single-line text fields.
*/
class TextField extends Field {
    render() {
        let input = document.createElement("input");
        input.type = "text";
        input.placeholder = this.options.label;
        input.value = this.options.value || "";
        input.autocomplete = "off";
        return input;
    }
}

// Helpers to create specific types of items
function canInsert(state, nodeType) {
    let $from = state.selection.$from;
    for (let d = $from.depth; d >= 0; d--) {
        let index = $from.index(d);
        if ($from.node(d).canReplaceWith(index, index, nodeType))
            return true;
    }
    return false;
}
function insertImageItem(nodeType) {
    return new MenuItem({
        title: "Insert image",
        label: "Image",
        enable(state) { return canInsert(state, nodeType); },
        run(state, _, view) {
            let { from, to } = state.selection, attrs = null;
            if (state.selection instanceof NodeSelection && state.selection.node.type == nodeType)
                attrs = state.selection.node.attrs;
            openPrompt({
                title: "Insert image",
                fields: {
                    src: new TextField({ label: "Location", required: true, value: attrs && attrs.src }),
                    title: new TextField({ label: "Title", value: attrs && attrs.title }),
                    alt: new TextField({ label: "Description",
                        value: attrs ? attrs.alt : state.doc.textBetween(from, to, " ") })
                },
                callback(attrs) {
                    view.dispatch(view.state.tr.replaceSelectionWith(nodeType.createAndFill(attrs)));
                    view.focus();
                }
            });
        }
    });
}
function cmdItem(cmd, options) {
    let passedOptions = {
        label: options.title,
        run: cmd
    };
    for (let prop in options)
        passedOptions[prop] = options[prop];
    if (!options.enable && !options.select)
        passedOptions[options.enable ? "enable" : "select"] = state => cmd(state);
    return new MenuItem(passedOptions);
}
function markActive(state, type) {
    let { from, $from, to, empty } = state.selection;
    if (empty)
        return !!type.isInSet(state.storedMarks || $from.marks());
    else
        return state.doc.rangeHasMark(from, to, type);
}
function markItem(markType, options) {
    let passedOptions = {
        active(state) { return markActive(state, markType); }
    };
    for (let prop in options)
        passedOptions[prop] = options[prop];
    return cmdItem(toggleMark(markType), passedOptions);
}
function linkItem(markType) {
    return new MenuItem({
        title: "Add or remove link",
        icon: icons.link,
        active(state) { return markActive(state, markType); },
        enable(state) { return !state.selection.empty; },
        run(state, dispatch, view) {
            if (markActive(state, markType)) {
                toggleMark(markType)(state, dispatch);
                return true;
            }
            openPrompt({
                title: "Create a link",
                fields: {
                    href: new TextField({
                        label: "Link target",
                        required: true
                    }),
                    title: new TextField({ label: "Title" })
                },
                callback(attrs) {
                    toggleMark(markType, attrs)(view.state, view.dispatch);
                    view.focus();
                }
            });
        }
    });
}
function wrapListItem(nodeType, options) {
    return cmdItem(wrapInList(nodeType, options.attrs), options);
}
/**
Given a schema, look for default mark and node types in it and
return an object with relevant menu items relating to those marks.
*/
function buildMenuItems(schema) {
    let r = {};
    let mark;
    if (mark = schema.marks.strong)
        r.toggleStrong = markItem(mark, { title: "Toggle strong style", icon: icons.strong });
    if (mark = schema.marks.em)
        r.toggleEm = markItem(mark, { title: "Toggle emphasis", icon: icons.em });
    if (mark = schema.marks.code)
        r.toggleCode = markItem(mark, { title: "Toggle code font", icon: icons.code });
    if (mark = schema.marks.link)
        r.toggleLink = linkItem(mark);
    let node;
    if (node = schema.nodes.image)
        r.insertImage = insertImageItem(node);
    if (node = schema.nodes.bullet_list)
        r.wrapBulletList = wrapListItem(node, {
            title: "Wrap in bullet list",
            icon: icons.bulletList
        });
    if (node = schema.nodes.ordered_list)
        r.wrapOrderedList = wrapListItem(node, {
            title: "Wrap in ordered list",
            icon: icons.orderedList
        });
    if (node = schema.nodes.blockquote)
        r.wrapBlockQuote = wrapItem(node, {
            title: "Wrap in block quote",
            icon: icons.blockquote
        });
    if (node = schema.nodes.paragraph)
        r.makeParagraph = blockTypeItem(node, {
            title: "Change to paragraph",
            label: "Plain"
        });
    if (node = schema.nodes.code_block)
        r.makeCodeBlock = blockTypeItem(node, {
            title: "Change to code block",
            label: "Code"
        });
    if (node = schema.nodes.heading)
        for (let i = 1; i <= 10; i++)
            r["makeHead" + i] = blockTypeItem(node, {
                title: "Change to heading " + i,
                label: "Level " + i,
                attrs: { level: i }
            });
    if (node = schema.nodes.horizontal_rule) {
        let hr = node;
        r.insertHorizontalRule = new MenuItem({
            title: "Insert horizontal rule",
            label: "Horizontal rule",
            enable(state) { return canInsert(state, hr); },
            run(state, dispatch) { dispatch(state.tr.replaceSelectionWith(hr.create())); }
        });
    }
    let cut = (arr) => arr.filter(x => x);
    r.insertMenu = new Dropdown(cut([r.insertImage, r.insertHorizontalRule]), { label: "Insert" });
    r.typeMenu = new Dropdown(cut([r.makeParagraph, r.makeCodeBlock, r.makeHead1 && new DropdownSubmenu(cut([
            r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6
        ]), { label: "Heading" })]), { label: "Type..." });
    r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleCode, r.toggleLink])];
    r.blockMenu = [cut([r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote, joinUpItem,
            liftItem, selectParentNodeItem])];
    r.fullMenu = r.inlineMenu.concat([[r.insertMenu, r.typeMenu]], [[undoItem, redoItem]], r.blockMenu);
    return r;
}

const mac$3 = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;
/**
Inspect the given schema looking for marks and nodes from the
basic schema, and if found, add key bindings related to them.
This will add:

* **Mod-b** for toggling [strong](https://prosemirror.net/docs/ref/#schema-basic.StrongMark)
* **Mod-i** for toggling [emphasis](https://prosemirror.net/docs/ref/#schema-basic.EmMark)
* **Mod-`** for toggling [code font](https://prosemirror.net/docs/ref/#schema-basic.CodeMark)
* **Ctrl-Shift-0** for making the current textblock a paragraph
* **Ctrl-Shift-1** to **Ctrl-Shift-Digit6** for making the current
  textblock a heading of the corresponding level
* **Ctrl-Shift-Backslash** to make the current textblock a code block
* **Ctrl-Shift-8** to wrap the selection in an ordered list
* **Ctrl-Shift-9** to wrap the selection in a bullet list
* **Ctrl->** to wrap the selection in a block quote
* **Enter** to split a non-empty textblock in a list item while at
  the same time splitting the list item
* **Mod-Enter** to insert a hard break
* **Mod-_** to insert a horizontal rule
* **Backspace** to undo an input rule
* **Alt-ArrowUp** to `joinUp`
* **Alt-ArrowDown** to `joinDown`
* **Mod-BracketLeft** to `lift`
* **Escape** to `selectParentNode`

You can suppress or map these bindings by passing a `mapKeys`
argument, which maps key names (say `"Mod-B"` to either `false`, to
remove the binding, or a new key name string.
*/
function buildKeymap(schema, mapKeys) {
    let keys = {}, type;
    function bind(key, cmd) {
        if (mapKeys) {
            let mapped = mapKeys[key];
            if (mapped === false)
                return;
            if (mapped)
                key = mapped;
        }
        keys[key] = cmd;
    }
    bind("Mod-z", undo);
    bind("Shift-Mod-z", redo);
    bind("Backspace", undoInputRule);
    if (!mac$3)
        bind("Mod-y", redo);
    bind("Alt-ArrowUp", joinUp);
    bind("Alt-ArrowDown", joinDown);
    bind("Mod-BracketLeft", lift);
    bind("Escape", selectParentNode);
    if (type = schema.marks.strong) {
        bind("Mod-b", toggleMark(type));
        bind("Mod-B", toggleMark(type));
    }
    if (type = schema.marks.em) {
        bind("Mod-i", toggleMark(type));
        bind("Mod-I", toggleMark(type));
    }
    if (type = schema.marks.code)
        bind("Mod-`", toggleMark(type));
    if (type = schema.nodes.bullet_list)
        bind("Shift-Ctrl-8", wrapInList(type));
    if (type = schema.nodes.ordered_list)
        bind("Shift-Ctrl-9", wrapInList(type));
    if (type = schema.nodes.blockquote)
        bind("Ctrl->", wrapIn(type));
    if (type = schema.nodes.hard_break) {
        let br = type, cmd = chainCommands(exitCode, (state, dispatch) => {
            if (dispatch)
                dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
            return true;
        });
        bind("Mod-Enter", cmd);
        bind("Shift-Enter", cmd);
        if (mac$3)
            bind("Ctrl-Enter", cmd);
    }
    if (type = schema.nodes.list_item) {
        bind("Enter", splitListItem(type));
        bind("Mod-[", liftListItem(type));
        bind("Mod-]", sinkListItem(type));
    }
    if (type = schema.nodes.paragraph)
        bind("Shift-Ctrl-0", setBlockType(type));
    if (type = schema.nodes.code_block)
        bind("Shift-Ctrl-\\", setBlockType(type));
    if (type = schema.nodes.heading)
        for (let i = 1; i <= 6; i++)
            bind("Shift-Ctrl-" + i, setBlockType(type, { level: i }));
    if (type = schema.nodes.horizontal_rule) {
        let hr = type;
        bind("Mod-_", (state, dispatch) => {
            if (dispatch)
                dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView());
            return true;
        });
    }
    return keys;
}

/**
Given a blockquote node type, returns an input rule that turns `"> "`
at the start of a textblock into a blockquote.
*/
function blockQuoteRule(nodeType) {
    return wrappingInputRule(/^\s*>\s$/, nodeType);
}
/**
Given a list node type, returns an input rule that turns a number
followed by a dot at the start of a textblock into an ordered list.
*/
function orderedListRule(nodeType) {
    return wrappingInputRule(/^(\d+)\.\s$/, nodeType, match => ({ order: +match[1] }), (match, node) => node.childCount + node.attrs.order == +match[1]);
}
/**
Given a list node type, returns an input rule that turns a bullet
(dash, plush, or asterisk) at the start of a textblock into a
bullet list.
*/
function bulletListRule(nodeType) {
    return wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
}
/**
Given a code block node type, returns an input rule that turns a
textblock starting with three backticks into a code block.
*/
function codeBlockRule(nodeType) {
    return textblockTypeInputRule(/^```$/, nodeType);
}
/**
Given a node type and a maximum level, creates an input rule that
turns up to that number of `#` characters followed by a space at
the start of a textblock into a heading whose level corresponds to
the number of `#` signs.
*/
function headingRule(nodeType, maxLevel) {
    return textblockTypeInputRule(new RegExp("^(#{1," + maxLevel + "})\\s$"), nodeType, match => ({ level: match[1].length }));
}
/**
A set of input rules for creating the basic block quotes, lists,
code blocks, and heading.
*/
function buildInputRules(schema) {
    let rules = smartQuotes.concat(ellipsis, emDash), type;
    if (type = schema.nodes.blockquote)
        rules.push(blockQuoteRule(type));
    if (type = schema.nodes.ordered_list)
        rules.push(orderedListRule(type));
    if (type = schema.nodes.bullet_list)
        rules.push(bulletListRule(type));
    if (type = schema.nodes.code_block)
        rules.push(codeBlockRule(type));
    if (type = schema.nodes.heading)
        rules.push(headingRule(type, 6));
    return inputRules({ rules });
}

/**
Create an array of plugins pre-configured for the given schema.
The resulting array will include the following plugins:

 * Input rules for smart quotes and creating the block types in the
   schema using markdown conventions (say `"> "` to create a
   blockquote)

 * A keymap that defines keys to create and manipulate the nodes in the
   schema

 * A keymap binding the default keys provided by the
   prosemirror-commands module

 * The undo history plugin

 * The drop cursor plugin

 * The gap cursor plugin

 * A custom plugin that adds a `menuContent` prop for the
   prosemirror-menu wrapper, and a CSS class that enables the
   additional styling defined in `style/style.css` in this package

Probably only useful for quickly setting up a passable
editor—you'll need more control over your settings in most
real-world situations.
*/
function exampleSetup(options) {
    let plugins = [
        buildInputRules(options.schema),
        keymap(buildKeymap(options.schema, options.mapKeys)),
        keymap(baseKeymap),
        dropCursor(),
        gapCursor()
    ];
    if (options.menuBar !== false)
        plugins.push(menuBar({ floating: options.floatingMenu !== false,
            content: options.menuContent || buildMenuItems(options.schema).fullMenu }));
    if (options.history !== false)
        plugins.push(history());
    return plugins.concat(new Plugin({
        props: {
            attributes: { class: "ProseMirror-example-setup-style" }
        }
    }));
}

export { exampleSetup };
