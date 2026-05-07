// basit pagination helper'lari
function getPagination(page, limit, totalCount) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = parseInt(limit, 10) || 20;
  const offset = (p - 1) * l;
  const totalPages = Math.max(1, Math.ceil(totalCount / l));
  return { page: p, limit: l, offset, totalPages, total: totalCount };
}

// currentQuery'yi koru, sadece overrides'i degistir, querystring dondur
function buildQuery(currentQuery, overrides) {
  const merged = { ...(currentQuery || {}), ...(overrides || {}) };
  const params = new URLSearchParams();
  for (const k of Object.keys(merged)) {
    if (merged[k] != null && merged[k] !== '') {
      params.append(k, merged[k]);
    }
  }
  return params.toString();
}

module.exports = { getPagination, buildQuery };
