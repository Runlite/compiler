import BaseRoute from "../route";
import express, { Router } from "express";
import { v1 } from "../route/v1.routes";
class RouteManager {
  private routes: BaseRoute[];
  constructor() {
    this.routes = [];
  }
  public addRoute(route: BaseRoute): void {
    route.init();
    this.routes.push(route);
  }
  public getRoutes(): Router {
    const router = express.Router();
    this.routes.forEach((route) => {
      router.use("/", route.router);
    });
    return router;
  }
}
const routeManager = new RouteManager();
routeManager.addRoute(new v1());
const routes = routeManager.getRoutes();
export { routes };
