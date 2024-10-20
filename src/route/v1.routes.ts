import { NextFunction, Request, Response } from "express";
import BaseRoute from ".";
import { CodeToLanguage } from "../constants";
import { Layers } from "../layers";
import { Language } from "../types";

export class v1 extends BaseRoute {
  private layers: Layers;

  constructor() {
    super("/v1");
    this.layers = new Layers();
  }

  protected initRoute() {
    this.router.post(
      this.path,
      this.middleware.validateRequest,
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { syntax, lang } = req.body as {
            syntax: string;
            lang: number;
          };

          const language = CodeToLanguage[lang];
          if (!language) {
            return res
              .status(400)
              .send({ error: `Unsupported language: ${lang}` });
          }

          const result = await this.layers.startProcess({
            syntax,
            lang: language,
          });

          res.status(200).send({ ...result });
        } catch (error) {
          next(error);
        }
      }
    );
  }
}
