import { RequestGuard } from "../guard/request.guard";
import { Router } from "express";
// Base Router instance
abstract class BaseRoute {
  public router: Router;
  protected path: string;
  protected requestGuard: RequestGuard;
  constructor(path: string) {
    this.router = Router();
    this.path = path;
    this.requestGuard = new RequestGuard();
  }

  public init() {
    this.initRoutes();
  }

  protected abstract initRoutes(): void;
}

export default BaseRoute;
export * from "./health.routes";
export * from "./compile.routes";
