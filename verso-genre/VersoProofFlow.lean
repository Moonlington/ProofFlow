import Verso

open Verso Doc

/-- Sections can have a type that is being parsed by the editor -/
structure VersoProofFlow.PartMetadata where
  type : String

def VersoProofFlow : Genre where
  -- No inline nor block
  Inline := Empty
  Block := Empty
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
  block _ _ blkExt := nomatch blkExt
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
