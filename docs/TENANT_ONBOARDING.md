# Tenant Onboarding

## Inputs Required

1. Tenant name
2. Region mapping
3. Branding values (optional): logo, primary color, accent color
4. Initial admin account phone in canonical E.164 format

## Steps

1. Create tenant row linked to region.
2. Create admin user with:
   - `phone`
   - `phoneE164`
   - `role=admin`
3. Seed TODA terminals for the tenant.
4. Validate tenant isolation by accessing booking APIs with a non-tenant user.
5. Confirm auth login binds to the canonical user identity (`phoneE164`).
