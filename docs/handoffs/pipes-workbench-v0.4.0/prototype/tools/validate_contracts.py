#!/usr/bin/env python3
"""Optional development validation. Install jsonschema in a dev environment only."""
import json,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2]
try:
 from jsonschema import Draft202012Validator,FormatChecker
except ImportError:
 print('Optional developer dependency required: python3 -m pip install jsonschema',file=sys.stderr);raise SystemExit(2)
pairs=[
 ('prototype-recipe','recipe-prototype'),('sonic-recipe-v2','recipe-v2-proposed'),
 ('singer-direction','singer-direction'),('voice-design-brief','voice-design-brief'),
 ('speech-handoff','speech-handoff'),('provider-capability','provider-capability-proposed'),
 ('estate-events','estate-event-proposed'),('command-envelope','compile-request'),
 ('command-envelope','variation-plan-request'),('command-envelope','variation-apply-request')]
checks=[]
for path in sorted((R/'contracts').glob('*.schema.json')):
 schema=json.loads(path.read_text());Draft202012Validator.check_schema(schema);checks.append('Schema shape: '+path.name)
for contract,example in pairs:
 schema=json.loads((R/'contracts'/f'{contract}.schema.json').read_text());record=json.loads((R/'examples'/f'{example}.json').read_text())
 Draft202012Validator(schema,format_checker=FormatChecker()).validate(record);checks.append(f'{example} validates against {contract}')
# Cross-reference checks that ordinary JSON Schema cannot express directly.
r=json.loads((R/'examples/recipe-v2-proposed.json').read_text());ids={p['part_id'] for p in r['ensemble']}
assert len(ids)==len(r['ensemble'])
assert all(set(s['active_parts'])<=ids for s in r['form'])
checks.append('Proposed recipe part IDs and section references are consistent.')
for name in ['compiled-suno','eleven-plan-draft']:
 p=json.loads((R/'examples'/f'{name}.json').read_text());units=len(p['style'].encode('utf-16-le'))//2
 assert units==p['style_count']<=1000;checks.append(f'{name} exact Style count: {units}/1000 UTF-16 units')
api=json.loads((R/'contracts/prototype-openapi.json').read_text());assert api['openapi']=='3.1.0';assert '/api/commands' in api['paths'];checks.append('Prototype OpenAPI JSON syntax and core route checked (not a full OAS conformance audit).')
report={'status':'passed','checks':checks,'boundary':'Local schemas/examples only; no remote service or provider validation.'}
(R/'qa/contract-validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
