import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("watch/:id", "routes/watch.tsx"),
  route("admin/ajout", "routes/admin.ajout.tsx"),
  route("debug", "routes/debug.tsx"),
  route("mongo-test", "routes/mongo-test.tsx"), // Nouvelle route
] satisfies RouteConfig;
