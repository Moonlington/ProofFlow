import VersoProofFlow

set_option pp.rawOnError true

#doc (VersoProofFlow) "ProofFlow Demo!" =>

:::collapsible
#Collapsible block for imports
Placeholder text
```lean
-- Define five as 5
def five : Nat := 5

-- Define five as 5
def wrongfive : Nat := 6
```

:::
# Correct Proof
:::input
.

```lean
-- Prove that five equals 5
theorem five_eq_5 : five = 5 := by
  rfl
```

:::
