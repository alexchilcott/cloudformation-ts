#!/usr/bin/env node

import program = require("commander");
import { Generator } from "./generator/generator";

try {
  program
    .description("Generate CloudFormation typescript definitions")
    .option(
      "--specUrl <url>",
      "The url of the cloudformation spec",
      "https://d1uauaxba7bl26.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json"
    )
    .option(
      "--outputDir <path>",
      "The directory of the generated cloudformation definition files"
    )
    .parse(process.argv);
} catch (error) {
  console.error(error);
}
async function main() {
  interface IProgramArgs {
    specUrl: string;
    outputDir: string;
  }

  function programHasArgs(program: IProgramArgs): program is IProgramArgs {
    return !!program.outputDir && !!program.specUrl;
  }

  const args = program as any;
  if (programHasArgs(args)) {
    const generator = new Generator();
    await generator.generate(args.specUrl, args.outputDir);
  } else {
    program.outputHelp();
  }
}

main()
  .then(() => console.log("done"))
  .catch(x => console.error(x));
