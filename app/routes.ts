import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("watch/:id", "routes/watch.tsx"),
  route("admin/auth", "routes/admin.auth.tsx"),
  route("admin", "routes/admin.tsx"),
  route("admin/ajout", "routes/admin.ajout.tsx"),
  route("admin/migration", "routes/admin.migration.tsx"),
  route("admin/utilisateurs", "routes/admin.utilisateurs.tsx"),
  route("admin/gestion", "routes/admin.gestion.tsx"),
  route("admin/debug", "routes/debug.tsx"),
  route("*", "routes/$.tsx"), // Ajouter la route catch-all pour les 404
] satisfies RouteConfig;