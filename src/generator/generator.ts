import * as rimraf from "rimraf";
import * as mkdirp from "mkdirp";
import * as request from "request-promise-native";
import { ISpec } from "./cloud-formation-spec";
import { mapSpecToModules } from "./convert-spec";
import { ModuleWriter } from "./module-writer";
import { copyFileSync } from "fs";
import * as path from "path";

export class Generator {
  async generate(specFileUrl: string, outdir: string) {
    rimraf.sync(outdir);
    mkdirp.sync(outdir);

    const scriptRoot = path.dirname(process.argv[1]);
    copyFileSync(
      path.join(scriptRoot, "generator", "resources", "core.ts.static"),
      path.join(outdir, "core.ts")
    );

    const specUrl = specFileUrl;

    const spec: ISpec = await request.get(specUrl, { gzip: true, json: true });
    const modules = mapSpecToModules(spec);
    const moduleWriter = new ModuleWriter();
    for (const mod of modules) {
      moduleWriter.writeModule(mod, outdir);
    }
  }
}
