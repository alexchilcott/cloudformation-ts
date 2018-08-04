#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const generator_1 = require("./generator/generator");
try {
    program
        .description("Generate CloudFormation typescript definitions")
        .option("--specUrl <url>", "The url of the cloudformation spec", "https://d1uauaxba7bl26.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json")
        .option("--outputDir <path>", "The directory of the generated cloudformation definition files")
        .parse(process.argv);
}
catch (error) {
    console.error(error);
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        function programHasArgs(program) {
            return !!program.outputDir && !!program.specUrl;
        }
        const args = program;
        if (programHasArgs(args)) {
            const generator = new generator_1.Generator();
            yield generator.generate(args.specUrl, args.outputDir);
        }
        else {
            program.outputHelp();
        }
    });
}
main()
    .then(() => console.log("done"))
    .catch(x => console.error(x));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBRUEscUNBQXNDO0FBQ3RDLHFEQUFrRDtBQUVsRCxJQUFJO0lBQ0YsT0FBTztTQUNKLFdBQVcsQ0FBQyxnREFBZ0QsQ0FBQztTQUM3RCxNQUFNLENBQ0wsaUJBQWlCLEVBQ2pCLG9DQUFvQyxFQUNwQyw0RkFBNEYsQ0FDN0Y7U0FDQSxNQUFNLENBQ0wsb0JBQW9CLEVBQ3BCLGdFQUFnRSxDQUNqRTtTQUNBLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDeEI7QUFBQyxPQUFPLEtBQUssRUFBRTtJQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDdEI7QUFDRDs7UUFNRSx3QkFBd0IsT0FBcUI7WUFDM0MsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUNsRCxDQUFDO1FBRUQsTUFBTSxJQUFJLEdBQUcsT0FBYyxDQUFDO1FBQzVCLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3hCLE1BQU0sU0FBUyxHQUFHLElBQUkscUJBQVMsRUFBRSxDQUFDO1lBQ2xDLE1BQU0sU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUN4RDthQUFNO1lBQ0wsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO1NBQ3RCO0lBQ0gsQ0FBQztDQUFBO0FBRUQsSUFBSSxFQUFFO0tBQ0gsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDL0IsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDIn0=