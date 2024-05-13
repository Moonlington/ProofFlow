import Verso

namespace VersoProofFlow

open Lean Elab
open Verso ArgParse Doc Elab

@[code_block_expander lean]
def lean : CodeBlockExpander
  | _, _ => pure #[]

@[code_block_expander text]
def text : CodeBlockExpander
  | _, _ => pure #[]

@[code_block_expander collapsible]
def collapsible : CodeBlockExpander
  | _, _ => pure #[]

@[code_block_expander input]
def input : CodeBlockExpander
  | _, _ => pure #[]
