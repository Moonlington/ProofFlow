import Lake
open Lake DSL

require verso from git "https://github.com/leanprover/verso.git"@"main"
require subverso from git "https://github.com/leanprover/subverso.git"@"main"

package «VersoProofFlow» where
  -- add package configuration options here

lean_lib «VersoProofFlow» where
  srcDir := "VersoProofFlow"
  roots := #[`VersoProofFlow]
  -- add library configuration options here

@[default_target]
lean_exe «versoproofflow» where
  root := `Main
