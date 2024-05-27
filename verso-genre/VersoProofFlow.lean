import Verso.Doc
import Verso.Doc.Concrete
import Verso.Doc.TeX
import Verso.Doc.Html
import Verso.Output.TeX
import Verso.Output.Html
import Verso.Doc.Lsp
import Verso.Doc.Elab

import Verso.Genre.Manual.Basic
import Verso.Genre.Manual.Slug
import Verso.Genre.Manual.TeX
import Verso.Genre.Manual.Html
import Verso.Genre.Manual.Html.Style
import Verso.Genre.Manual.Docstring

open Lean (Name NameMap Json ToJson FromJson)

open Verso.Doc Elab
structure Block where
  name : Name
  id : String

def VersoProofFlow.Block.code : Block where
  name := `VersoProofFlow.Block.code
  id := "code"

@[directive_expander code]
def code : DirectiveExpander
  | #[], stxs => do
    let args ← stxs.mapM elabBlock
    let val ← ``(Block.other VersoProofFlow.Block.code #[ $[ $args ],* ])
    pure #[val]
  | _, _ => Lean.Elab.throwUnsupportedSyntax

def VersoProofFlow.Block.text : Block where
  name := `VersoProofFlow.Block.text
  id := "text"

@[directive_expander text]
def text : DirectiveExpander
  | #[], stxs => do
    let args ← stxs.mapM elabBlock
    let val ← ``(Block.other VersoProofFlow.Block.text #[ $[ $args ],* ])
    pure #[val]
  | _, _ => Lean.Elab.throwUnsupportedSyntax

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
