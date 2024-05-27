import Lake
open Lake DSL

require verso from git "https://github.com/leanprover/verso.git"@"main"

package VersoProofFlow where
  -- add package configuration options here

lean_lib VersoProofFlow where
  srcDir := "."
  roots := #[`VersoProofFlow]

lean_exe versoproofflow where
  srcDir := "."
  root := `VersoProofFlowMain
