"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const rimraf = __importStar(require("rimraf"));
const mkdirp = __importStar(require("mkdirp"));
const request = __importStar(require("request-promise-native"));
const convert_spec_1 = require("./convert-spec");
const module_writer_1 = require("./module-writer");
const fs_1 = require("fs");
const path = __importStar(require("path"));
class Generator {
    generate(specFileUrl, outdir) {
        return __awaiter(this, void 0, void 0, function* () {
            rimraf.sync(outdir);
            mkdirp.sync(outdir);
            const scriptRoot = path.dirname(process.argv[1]);
            fs_1.copyFileSync(path.join(scriptRoot, "generator", "resources", "core.ts.static"), path.join(outdir, "core.ts"));
            const specUrl = specFileUrl;
            const spec = yield request.get(specUrl, { gzip: true, json: true });
            const modules = convert_spec_1.mapSpecToModules(spec);
            const moduleWriter = new module_writer_1.ModuleWriter();
            for (const mod of modules) {
                moduleWriter.writeModule(mod, outdir);
            }
        });
    }
}
exports.Generator = Generator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2dlbmVyYXRvci9nZW5lcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQ0FBaUM7QUFDakMsK0NBQWlDO0FBQ2pDLGdFQUFrRDtBQUVsRCxpREFBa0Q7QUFDbEQsbURBQStDO0FBQy9DLDJCQUFrQztBQUNsQywyQ0FBNkI7QUFFN0I7SUFDUSxRQUFRLENBQUMsV0FBbUIsRUFBRSxNQUFjOztZQUNoRCxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFcEIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakQsaUJBQVksQ0FDVixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixDQUFDLEVBQ2pFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUM3QixDQUFDO1lBRUYsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDO1lBRTVCLE1BQU0sSUFBSSxHQUFVLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sT0FBTyxHQUFHLCtCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sWUFBWSxHQUFHLElBQUksNEJBQVksRUFBRSxDQUFDO1lBQ3hDLEtBQUssTUFBTSxHQUFHLElBQUksT0FBTyxFQUFFO2dCQUN6QixZQUFZLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQzthQUN2QztRQUNILENBQUM7S0FBQTtDQUNGO0FBcEJELDhCQW9CQyJ9