import { deleteSelection } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap"
import { Schema } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { mathPlugin, mathSerializer } from "@benrbray/prosemirror-math"

export function createPlugins(schema : Schema) : Plugin[] {
  let plugins = new Array<Plugin>();
  
  plugins.push(mathPlugin);
  plugins.push(keymap({
    "Backspace": deleteSelection,
    "Delete": deleteSelection,
  }))
  return plugins;
}