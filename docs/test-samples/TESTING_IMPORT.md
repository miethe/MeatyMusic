# Testing Import Functionality

This guide provides instructions for testing the import functionality for all entities in MeatyMusic.

## Prerequisites

1. Backend API server running on `http://localhost:8000`
2. Frontend web app running on `http://localhost:3000`
3. Sample JSON files in this directory

## Backend API Testing

### Test Sources Import (NEW)

```bash
# Using curl
curl -X POST http://localhost:8000/api/v1/sources/import \
  -H "Content-Type: multipart/form-data" \
  -F "file=@import-source-sample.json"

# Expected Response (HTTP 201):
{
  "id": "uuid",
  "name": "Music Theory Reference",
  "description": "Comprehensive music theory knowledge base...",
  "kind": "file",
  "uri": "file:///data/sources/music-theory.txt",
  "mcp_scope": "knowledge",
  "active": true,
  "imported_at": "2025-11-19T...",
  "import_source_filename": "import-source-sample.json",
  "created_at": "2025-11-19T...",
  ...
}
```

### Test Styles Import

```bash
curl -X POST http://localhost:8000/api/v1/styles/import \
  -H "Content-Type: multipart/form-data" \
  -F "file=@import-style-sample.json"
```

### Test Personas Import

```bash
curl -X POST http://localhost:8000/api/v1/personas/import \
  -H "Content-Type: multipart/form-data" \
  -F "file=@import-persona-sample.json"
```

### All Import Endpoints

- `POST /api/v1/blueprints/import`
- `POST /api/v1/lyrics/import`
- `POST /api/v1/personas/import`
- `POST /api/v1/producer-notes/import`
- `POST /api/v1/sources/import` ← NEW
- `POST /api/v1/styles/import`

## Frontend UI Testing

### Test Sources Import Page

1. Navigate to: `http://localhost:3000/entities/sources`
2. Click the "Import" button in the page header
3. The ImportModal opens with "Source" pre-selected
4. Click "Upload JSON File"
5. Select `import-source-sample.json`
6. JSON preview appears with validation status
7. Click "Import"
8. Success toast appears: "Source imported successfully"
9. Modal closes automatically

### Test Other Entity Imports

All entity pages have the same import flow:

- **Styles**: `http://localhost:3000/entities/styles`
- **Lyrics**: `http://localhost:3000/entities/lyrics`
- **Personas**: `http://localhost:3000/entities/personas`
- **Producer Notes**: `http://localhost:3000/entities/producer-notes`
- **Blueprints**: `http://localhost:3000/entities/blueprints`
- **Sources**: `http://localhost:3000/entities/sources` ← NEW

## Test Cases

### Happy Path Tests

1. **Valid JSON file**
   - Upload a valid JSON file
   - Should show success and create entity

2. **Import metadata**
   - Check that imported entity has:
     - `imported_at` timestamp
     - `import_source_filename` set to uploaded filename

3. **Pre-selected entity type**
   - Open import from entity-specific page
   - Entity type should be pre-selected
   - Should not show entity type dropdown

### Error Handling Tests

1. **Invalid file extension**
   ```bash
   # Upload a .txt file instead of .json
   curl -X POST http://localhost:8000/api/v1/sources/import \
     -F "file=@test.txt"

   # Expected: HTTP 400
   # "Only JSON files are supported. File must have .json extension"
   ```

2. **Invalid JSON syntax**
   ```bash
   # Upload malformed JSON
   echo '{invalid json}' > invalid.json
   curl -X POST http://localhost:8000/api/v1/sources/import \
     -F "file=@invalid.json"

   # Expected: HTTP 400
   # "Invalid JSON format: ..."
   ```

3. **Schema validation failure**
   ```bash
   # Upload JSON missing required fields
   echo '{"name": "Test"}' > incomplete.json
   curl -X POST http://localhost:8000/api/v1/sources/import \
     -F "file=@incomplete.json"

   # Expected: HTTP 400
   # {
   #   "message": "Validation failed",
   #   "errors": [
   #     {"field": "kind", "message": "Field required"},
   #     {"field": "uri", "message": "Field required"}
   #   ]
   # }
   ```

4. **Tag conflicts (Styles only)**
   ```json
   // style-with-conflicts.json
   {
     "name": "Conflicting Style",
     "genre": "test",
     "tags": ["whisper", "anthemic"]  // These conflict!
   }
   ```
   ```bash
   curl -X POST http://localhost:8000/api/v1/styles/import \
     -F "file=@style-with-conflicts.json"

   # Expected: HTTP 400
   # "Tag conflicts detected: whisper ↔ anthemic"
   ```

5. **Frontend validation errors**
   - Upload a .txt file → Shows error message
   - Upload invalid JSON → Shows parse error
   - Upload JSON with schema errors → Shows validation errors list

## Automated Testing

### Python Unit Tests

Create test file: `services/api/tests/test_import_endpoints.py`

```python
import pytest
from fastapi.testclient import TestClient
from io import BytesIO

def test_import_source_success(client: TestClient):
    """Test successful source import."""
    json_content = b'''
    {
        "name": "Test Source",
        "description": "Test description",
        "kind": "file",
        "uri": "file:///test.txt",
        "mcp_scope": "test",
        "active": true
    }
    '''

    response = client.post(
        "/api/v1/sources/import",
        files={"file": ("test.json", BytesIO(json_content), "application/json")}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Source"
    assert data["imported_at"] is not None
    assert data["import_source_filename"] == "test.json"

def test_import_source_invalid_extension(client: TestClient):
    """Test import with invalid file extension."""
    response = client.post(
        "/api/v1/sources/import",
        files={"file": ("test.txt", BytesIO(b"test"), "text/plain")}
    )

    assert response.status_code == 400
    assert "JSON" in response.json()["detail"]

def test_import_source_invalid_json(client: TestClient):
    """Test import with invalid JSON."""
    response = client.post(
        "/api/v1/sources/import",
        files={"file": ("test.json", BytesIO(b"{invalid}"), "application/json")}
    )

    assert response.status_code == 400
    assert "JSON format" in response.json()["detail"]
```

### Frontend E2E Tests

Create test file: `apps/web/e2e/import.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Entity Import', () => {
  test('should import source successfully', async ({ page }) => {
    // Navigate to sources page
    await page.goto('/entities/sources');

    // Click import button
    await page.click('button:has-text("Import")');

    // Modal should be visible
    await expect(page.locator('dialog')).toBeVisible();

    // Upload file
    await page.setInputFiles('input[type="file"]', 'docs/test-samples/import-source-sample.json');

    // Wait for validation
    await expect(page.locator('text=No conflicts found')).toBeVisible();

    // Click import
    await page.click('button:has-text("Import")');

    // Success toast
    await expect(page.locator('text=Source imported successfully')).toBeVisible();

    // Modal should close
    await expect(page.locator('dialog')).not.toBeVisible();
  });

  test('should show error for invalid file', async ({ page }) => {
    await page.goto('/entities/sources');
    await page.click('button:has-text("Import")');

    // Upload non-JSON file
    await page.setInputFiles('input[type="file"]', 'README.md');

    // Error should be shown
    await expect(page.locator('text=Only JSON files are supported')).toBeVisible();
  });
});
```

## Verification Checklist

After implementing Phase 4, verify:

- [ ] All 6 import endpoints exist and respond to POST requests
- [ ] All 6 entity pages have Import button in header
- [ ] ImportModal component includes 'source' in entity types
- [ ] Uploading valid JSON creates entity with import metadata
- [ ] Invalid file extensions are rejected
- [ ] Invalid JSON syntax is caught and reported
- [ ] Schema validation errors are displayed with field names
- [ ] Success toast appears after successful import
- [ ] Modal closes automatically after success
- [ ] Backend logs show import operations
- [ ] OpenTelemetry traces capture import spans

## Sample Test Session

```bash
# 1. Start services
docker-compose up -d

# 2. Test all import endpoints
for entity in styles lyrics personas producer-notes blueprints sources; do
  echo "Testing $entity import..."
  curl -X POST http://localhost:8000/api/v1/${entity}/import \
    -F "file=@docs/test-samples/import-${entity}-sample.json" \
    | jq '.id'
done

# 3. Verify entities were created
curl http://localhost:8000/api/v1/sources | jq '.items[0].imported_at'
curl http://localhost:8000/api/v1/styles | jq '.items[0].import_source_filename'

# 4. Check logs for import operations
docker-compose logs api | grep "import"
```

## Troubleshooting

### Import endpoint returns 404
- Check API router registration in `main.py`
- Verify endpoint is included in API router

### Import endpoint returns 500
- Check service layer for errors
- Verify database schema matches Pydantic models
- Check logs: `docker-compose logs api`

### Frontend import button doesn't work
- Check browser console for errors
- Verify ImportModal is imported correctly
- Check API client configuration

### Validation always fails
- Compare JSON against schema in `schemas/*.schema.json`
- Check Pydantic model definitions
- Verify field names match exactly (case-sensitive)

## Documentation

- API Documentation: http://localhost:8000/docs
- Entity Schemas: `/schemas/*.schema.json`
- Implementation Summary: `/docs/phase-4-import-completion-summary.md`
