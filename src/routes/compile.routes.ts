import { NextFunction, Request, Response } from "express";
import BaseRoute from ".";
import { CodeToLanguage } from "../constants";
import { Layers } from "../layers";

export class v1 extends BaseRoute {
  private layers: Layers;

  constructor() {
    super("/v1");
    this.layers = new Layers();
  }

  protected initRoutes() {
    this.router.post(
      this.path,
      this.requestGuard.validateRequest,
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { syntax, lang } = req.body as {
            syntax: string;
            lang: number;
          };

          const language = CodeToLanguage[lang];
          if (!language) {
            res.status(400).send({ error: `Unsupported language: ${lang}` });
            return;
          }

          const result = await this.layers.startProcess({
            syntax,
            lang: language,
          });

          res.status(200).send({ ...result });
        } catch (error) {
          next(error);
        }
      },
    );
  }
}
