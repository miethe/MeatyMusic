# Application Routes

This directory will contain MeatyMusic AMCS Next.js app routes in Phase 5:

## Planned Route Structure

```
/                           - Dashboard/Landing page
/songs                      - Song library listing
/songs/new                  - Song creation wizard
/songs/[id]                 - Song details and edit
/songs/[id]/workflow        - Workflow execution view
/songs/[id]/artifacts       - Generated artifacts view
/personas                   - Persona library
/personas/new               - Create persona
/personas/[id]              - Persona details and edit
/sources                    - External source registry
/sources/new                - Add new source
/blueprints                 - Genre blueprint browser
/settings                   - User settings and preferences
/api/*                      - API routes (if needed for Next.js API routes)
```

## Implementation Reference

See:
- Phase 5 implementation plan: `/docs/project_plans/impl_tracking/bootstrap-phase-5/`
- Website/App PRD: `/docs/project_plans/PRDs/website_app.prd.md`
- Route configuration: `/apps/web/src/config/routes.ts`

## Infrastructure Preserved

This directory maintains route infrastructure:
- Next.js 14+ App Router structure
- Middleware in `/apps/web/src/middleware.ts`
- Route utilities in `/apps/web/src/config/`

Routes will implement:
- Server and Client Components appropriately
- Suspense boundaries for loading states
- Error boundaries for error handling
- Metadata configuration for SEO
- Real-time updates via WebSocket events
