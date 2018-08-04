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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxxQ0FBc0M7QUFDdEMscURBQWtEO0FBRWxELElBQUk7SUFDRixPQUFPO1NBQ0osV0FBVyxDQUFDLGdEQUFnRCxDQUFDO1NBQzdELE1BQU0sQ0FDTCxpQkFBaUIsRUFDakIsb0NBQW9DLEVBQ3BDLDRGQUE0RixDQUM3RjtTQUNBLE1BQU0sQ0FDTCxvQkFBb0IsRUFDcEIsZ0VBQWdFLENBQ2pFO1NBQ0EsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUN4QjtBQUFDLE9BQU8sS0FBSyxFQUFFO0lBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztDQUN0QjtBQUNEOztRQU1FLHdCQUF3QixPQUFxQjtZQUMzQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQ2xELENBQUM7UUFFRCxNQUFNLElBQUksR0FBRyxPQUFjLENBQUM7UUFDNUIsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDeEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxxQkFBUyxFQUFFLENBQUM7WUFDbEMsTUFBTSxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ3hEO2FBQU07WUFDTCxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7U0FDdEI7SUFDSCxDQUFDO0NBQUE7QUFFRCxJQUFJLEVBQUU7S0FDSCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUMvQixLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMifQ==