import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("watch/:id", "routes/watch.tsx"),
  route("admin/ajout", "routes/admin.ajout.tsx"),
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
