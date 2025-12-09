// Attach org context to the request from authenticated user
export const orgContext = (req, res, next) => {
  const orgId =
    req.user?.org_id ||
    req.user?.orgId ||
    req.user?.organizationId ||
    req.user?.organisationId ||
    null;

  req.orgId = orgId;
  // helper: build org filter for where clauses
  req.withOrg = (base = {}) => {
    if (!orgId) return base;
    return { ...base, org_id: orgId };
  };

  next();
};




