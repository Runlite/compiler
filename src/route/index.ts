import { Router } from "express";
import { Middleware } from "../middleware";

abstract class BaseRoute {
  public router: Router;
  protected path: string;
  protected middleware: Middleware;

  constructor(path: string) {
    this.router = Router();
    this.path = path;
    this.middleware = new Middleware();
  }

  public init() {
    this.initRoute();
  }

  protected abstract initRoute(): void;
}

export default BaseRoute;
