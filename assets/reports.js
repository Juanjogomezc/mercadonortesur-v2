/* ============================================================
   Mercado Norte Sur — Lógica de reportes (pura, sin Firebase)
   Recibe publicaciones y usuarios ya cargados y calcula KPIs,
   series para gráficos y el CSV exportable.
   ============================================================ */

export const CAT_LABELS = {
  camping: "Camping", escalada: "Escalada", trekking: "Trekking", surf: "Surf", pesca: "Pesca",
  ciclismo: "Ciclismo", nieve: "Nieve", navegacion: "Navegación", servicios: "Servicios y arriendos"
};

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DAY = 24 * 3600 * 1000;

function ms(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  return Number(ts) || 0;
}

export function computeReport(listings, users, now = Date.now()) {
  const status = { approved: 0, pending: 0, rejected: 0, paused: 0 };
  const catMap = {};
  const sellerMap = {};
  let inventoryValue = 0;
  let reviewSum = 0, reviewN = 0;

  for (const l of listings) {
    status[l.status] = (status[l.status] || 0) + 1;

    const reviewed = ms(l.reviewedAt), created = ms(l.createdAt);
    if (reviewed && created && reviewed >= created) { reviewSum += reviewed - created; reviewN++; }

    if (l.status === "approved") {
      const price = Number(l.price) || 0;
      inventoryValue += price;
      const c = catMap[l.category] || (catMap[l.category] = { key: l.category, label: CAT_LABELS[l.category] || l.category, count: 0, value: 0 });
      c.count++; c.value += price;

      const s = sellerMap[l.sellerId] || (sellerMap[l.sellerId] = { name: l.sellerName || "—", count: 0, value: 0, cats: {} });
      s.count++; s.value += price; s.cats[l.category] = (s.cats[l.category] || 0) + 1;
    }
  }

  // Los pausados fueron aprobados antes, cuentan como aprobados para la tasa
  const decided = status.approved + status.paused + status.rejected;
  const approvalRate = decided ? Math.round(((status.approved + status.paused) / decided) * 100) : null;
  const avgReviewHours = reviewN ? Math.round((reviewSum / reviewN / 3600000) * 10) / 10 : null;

  const regular = users.filter(u => u.role !== "admin");
  const newUsers30 = regular.filter(u => ms(u.createdAt) >= now - 30 * DAY).length;
  const usersPending = regular.filter(u => u.status === "pending").length;

  // Usuarios nuevos por mes, últimos 6 meses (incluye el actual)
  const d = new Date(now);
  const labels = [], data = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(d.getFullYear(), d.getMonth() - i, 1).getTime();
    const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 1).getTime();
    labels.push(MONTHS[new Date(start).getMonth()]);
    data.push(regular.filter(u => ms(u.createdAt) >= start && ms(u.createdAt) < end).length);
  }

  const categories = Object.values(catMap).sort((a, b) => b.count - a.count);
  const topSellers = Object.values(sellerMap)
    .map(s => {
      const top = Object.entries(s.cats).sort((a, b) => b[1] - a[1])[0];
      return { name: s.name, count: s.count, value: s.value, topCategory: top ? (CAT_LABELS[top[0]] || top[0]) : "—" };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    totals: {
      listings: listings.length, ...status, users: regular.length, usersPending, newUsers30,
      inventoryValue, approvalRate, avgReviewHours
    },
    categories, usersByMonth: { labels, data }, topSellers
  };
}

// CSV compatible con Excel (BOM + comillas escapadas)
export function toCSV(rows) {
  const cell = v => {
    const s = String(v ?? "");
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return "\ufeff" + rows.map(r => r.map(cell).join(",")).join("\r\n");
}

export function reportRows(report, dateLabel) {
  const t = report.totals;
  return [
    ["Reporte Mercado Norte Sur", dateLabel], [],
    ["Indicador", "Valor"],
    ["Publicaciones totales", t.listings],
    ["Activas (aprobadas)", t.approved],
    ["En revisión", t.pending],
    ["Rechazadas", t.rejected],
    ["Pausadas", t.paused],
    ["Valor del catálogo activo (CLP)", t.inventoryValue],
    ["Tasa de aprobación", t.approvalRate == null ? "—" : t.approvalRate + "%"],
    ["Tiempo promedio de revisión (horas)", t.avgReviewHours == null ? "—" : t.avgReviewHours],
    ["Usuarios registrados", t.users],
    ["Cuentas pendientes de aprobación", t.usersPending],
    ["Usuarios nuevos (30 días)", t.newUsers30], [],
    ["Categoría", "Publicaciones activas", "Valor del catálogo (CLP)"],
    ...report.categories.map(c => [c.label, c.count, c.value]), [],
    ["Top vendedores", "Categoría principal", "Publicaciones activas", "Valor del catálogo (CLP)"],
    ...report.topSellers.map(s => [s.name, s.topCategory, s.count, s.value]), [],
    ["Usuarios nuevos por mes", ...report.usersByMonth.labels],
    ["", ...report.usersByMonth.data]
  ];
}
