import Lean.Elab.Command
import Lean.Elab.InfoTree

import Verso
import Verso.Doc.ArgParse
import Verso.Code

import SubVerso.Examples.Slice
import SubVerso.Highlighting

open Lean Elab
open Verso ArgParse Doc Elab Html Code
open SubVerso.Examples.Slice
open SubVerso.Highlighting Highlighted

structure Block where
  name : Name
  id : String

def VersoProofFlow.Block.lean : Block where
  name := `VersoProofFlow.Block.lean
  id := "lean"

def parserInputString [Monad m] [MonadFileMap m] (str : TSyntax `str) : m String := do
  let preString := (← getFileMap).source.extract 0 (str.raw.getPos?.getD 0)
  let mut code := ""
  let mut iter := preString.iter
  while !iter.atEnd do
    if iter.curr == '\n' then code := code.push '\n'
    else
      for _ in [0:iter.curr.utf8Size.toNat] do
        code := code.push ' '
    iter := iter.next
  code := code ++ str.getString
  return code

@[code_block_expander lean]
def lean : CodeBlockExpander
  | _, str => do
    let altStr ← parserInputString str

    let ictx := Parser.mkInputContext altStr (← getFileName)
    let cctx : Command.Context := { fileName := ← getFileName, fileMap := FileMap.ofString altStr, tacticCache? := none, snap? := none}
    let mut cmdState : Command.State := {env := ← getEnv, maxRecDepth := ← MonadRecDepth.getMaxRecDepth, scopes := [{header := ""}, {header := ""}]}
    let mut pstate := {pos := 0, recovering := false}
    let mut exercises := #[]
    let mut solutions := #[]

    repeat
      let scope := cmdState.scopes.head!
      let pmctx := { env := cmdState.env, options := scope.opts, currNamespace := scope.currNamespace, openDecls := scope.openDecls }
      let (cmd, ps', messages) := Parser.parseCommand ictx pmctx pstate cmdState.messages
      pstate := ps'
      cmdState := {cmdState with messages := messages}

      -- dbg_trace "Unsliced is {cmd}"
      let slices : Slices ← DocElabM.withFileMap (FileMap.ofString altStr) (sliceSyntax cmd)
      let sol := slices.sliced.findD "solution" slices.residual
      solutions := solutions.push sol
      let ex := slices.sliced.findD "exercise" slices.residual
      exercises := exercises.push ex

      cmdState ← withInfoTreeContext (mkInfoTree := pure ∘ InfoTree.node (.ofCommandInfo {elaborator := `DemoTextbook.Exts.lean, stx := cmd})) do
        let mut cmdState := cmdState
        -- dbg_trace "Elaborating {ex}"
        match (← liftM <| EIO.toIO' <| (Command.elabCommand ex cctx).run cmdState) with
        | Except.error e => logError e.toMessageData
        | Except.ok ((), s) =>
          cmdState := {s with env := cmdState.env}

        -- dbg_trace "Elaborating {sol}"
        match (← liftM <| EIO.toIO' <| (Command.elabCommand sol cctx).run cmdState) with
        | Except.error e => logError e.toMessageData
        | Except.ok ((), s) =>
          cmdState := s

        pure cmdState

      if Parser.isTerminalCommand cmd then break

    setEnv cmdState.env
    for t in cmdState.infoState.trees do
      -- dbg_trace (← t.format)
      pushInfoTree t

    for msg in cmdState.messages.msgs do
      logMessage msg

    let mut hls := Highlighted.empty
    for cmd in exercises do
      hls := hls ++ (← highlight cmd cmdState.messages.msgs.toArray cmdState.infoState.trees)
    pure #[]

def VersoProofFlow.Block.math : Block where
  name := `VersoProofFlow.Block.math
  id := "math"

@[directive_expander math]
def math : DirectiveExpander
  | #[], stxs => do
    let args ← stxs.mapM elabBlock
    let val ← ``(Block.other VersoProofFlow.Block.math #[ $[ $args ],* ])
    pure #[val]
  | _, _ => Lean.Elab.throwUnsupportedSyntax

def VersoProofFlow.Block.collapsible : Block where
  name := `VersoProofFlow.Block.collapsible
  id := "collapsible"

@[directive_expander collapsible]
def collapsible : DirectiveExpander
  | #[], stxs => do
    let args ← stxs.mapM elabBlock
    let val ← ``(Block.other VersoProofFlow.Block.collapsible #[ $[ $args ],* ])
    pure #[val]
  | _, _ => Lean.Elab.throwUnsupportedSyntax

def VersoProofFlow.Block.input : Block where
  name := `VersoProofFlow.Block.input
  id := "input"

@[directive_expander input]
def input : DirectiveExpander
  | #[], stxs => do
    let args ← stxs.mapM elabBlock
    let val ← ``(Block.other VersoProofFlow.Block.input #[ $[ $args ],* ])
    pure #[val]
  | _, _ => Lean.Elab.throwUnsupportedSyntax

/-- Sections can have a type that is being parsed by the editor -/
structure VersoProofFlow.PartMetadata where
  type : String

def VersoProofFlow : Genre where
  -- No inline nor block
  Inline := Empty
  Block := Block
  -- We only have the part metadata
  PartMetadata := VersoProofFlow.PartMetadata
  -- No Traverse state or context
  TraverseContext := Unit
  TraverseState := Unit

namespace VersoProofFlow

open Verso.Output Html

instance : GenreHtml VersoProofFlow IO where
  -- When rendering a part to HTMl, extract the incoming links from the final traversal state and
  -- insert back-references
  part recur metadata | (.mk title titleString _ content subParts) => do
    let content' := content
    -- It's important that this not include the metadata in the recursive call, or the generator
    -- will loop (the metadata's presence is what triggers the call to `GenreHtml.part`)
    let part' := .mk title titleString none content' subParts
    recur part' #[("id", metadata.type)]
  -- There are no genre-specific blocks, so no code is needed here
  block _ recur
  | b, contents => do
      pure {{<p id=s!"{b.id}"> {{← contents.mapM recur}} </p>}}
  inline _ inlExt := nomatch inlExt

/--
The main function to be called to produce HTML output
-/
def render (doc : Part VersoProofFlow) : IO UInt32 := do
  let mut doc := doc

  let mut state : VersoProofFlow.TraverseState := ()
  let context : VersoProofFlow.TraverseContext := ()

  -- Render the resulting document to HTML. This requires a way to log errors.
  let hadError ← IO.mkRef false
  let logError str := do
    hadError.set true
    IO.eprintln str

  IO.println "Rendering HTML"
  let html := {{
    <html>
      <head>
        <title>{{doc.titleString}}</title>
        <meta charset="utf-8"/>
      </head>
      <body>{{← VersoProofFlow.toHtml {logError} context state doc}}</body>
    </html>
  }}

  IO.println "Writing to index.html"
  IO.FS.withFile "_out/index.html" .write fun h => do
    h.putStrLn html.asString

  if (← hadError.get) then
    IO.eprintln "Errors occurred while rendering"
    pure 1
  else
    pure 0

end VersoProofFlow
