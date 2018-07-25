import * as rimraf from "rimraf";
import * as mkdirp from "mkdirp";
import * as request from "request-promise-native";
import { ISpec } from "./cloud-formation-spec";
import { mapSpecToModules } from "./convert-spec";
import { ModuleWriter } from "./module-writer";
import { copyFileSync } from "fs";
import * as path from "path";

const main = async () => {
  const scriptRoot = path.dirname(process.argv[1]);
  const outputRoot = process.cwd();
  const outdir = path.join(outputRoot, "generated");
  rimraf.sync(outdir);
  mkdirp.sync(outdir);

  copyFileSync(
    path.join(scriptRoot, "resources", "core.ts.static"),
    path.join(outdir, "core.ts")
  );

  const specUrl =
    "https://d1uauaxba7bl26.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json";

  const spec: ISpec = await request.get(specUrl, { gzip: true, json: true });
  const modules = mapSpecToModules(spec);
  const moduleWriter = new ModuleWriter();
  for (const mod of modules) {
    moduleWriter.writeModule(mod, outdir);
  }
};

main()
  .then(() => console.log("done"))
  .catch(x => console.error(x));
