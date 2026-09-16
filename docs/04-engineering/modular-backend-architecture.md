# Modular Backend Architecture

The composition root wires target modules; modules do not query one another's tables directly. Cross-module behavior uses small application contracts, for example pact requesting Circle eligibility or focus requesting pact state.

`privacy` orchestrates deletion/export one way across data owners. `analytics` receives allowlisted events one way and never queries private domain tables.
