# Contract status

`prototype-openapi.json`, `command-envelope.schema.json`, `prototype-recipe.schema.json` and `singer-direction.schema.json` document the delivered review implementation. The exported singer/speech brief schemas describe the locally generated artifacts; their acceptance by other applications is **proposed**, not implemented there.

`sonic-recipe-v2.schema.json`, `provider-capability.schema.json` and `estate-events.schema.json` are **production design targets**, not deployed schemas. Validate migrations and current estate/provider contracts before integration.

The prototype store remains governed by its domain handlers; examples/schema validation is an additional check, not a claim that arbitrary JSON Schema is evaluated on every command. Cross-record references, locks, time bounds and exact provider character counters need semantic validation. The official Voice Lab promotion contract remains owned by Voice Lab, not redefined here.
