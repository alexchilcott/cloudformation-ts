"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
class Writer {
    constructor() {
        this.indentAmount = 0;
        this._content = "";
        this.indent = () => this.indentAmount++;
        this.unindent = () => this.indentAmount--;
        this.line = (text) => `${this.indentation()}${text}\n`;
        this.write = (text) => (this._content = this._content + text);
        this.writeLine = (line) => (this._content = `${this._content}${this.line(line)}`);
        this.withIndent = (action) => {
            this.indent();
            action();
            this.unindent();
        };
        this.indentation = () => {
            let indentBy;
            indentBy = (level) => {
                if (level == 0) {
                    return "";
                }
                else {
                    return "  " + indentBy(level - 1);
                }
            };
            return indentBy(this.indentAmount);
        };
    }
    get content() {
        return this._content;
    }
}
class ModuleWriter {
    writeModule(module, rootDir) {
        const writer = new Writer();
        function formatImport(symbol, alias) {
            if (alias) {
                return `${symbol} as ${alias}`;
            }
            else
                return symbol;
        }
        for (const i of module.imports) {
            const importedSymbols = i.imports.map(s => formatImport(s.symbol, s.alias));
            writer.writeLine(`import {${importedSymbols.join(", ")}} from './${path_1.relative(path_1.parse(module.absolutePath).dir, i.moduleAbsolutePath)}';`);
        }
        for (const typeAlias of module.exportedTypeAliases || []) {
            writer.writeLine(`export type ${typeAlias.name} = ${typeAlias.aliasedType};`);
        }
        for (const exportedInterface of module.exportedInterfaces || []) {
            const extendsClause = exportedInterface.extends
                ? ` extends ${exportedInterface.extends}`
                : "";
            writer.writeLine(`export interface ${exportedInterface.name}${extendsClause} {`);
            writer.withIndent(() => {
                for (const propName in exportedInterface.properties) {
                    const propDefinition = exportedInterface.properties[propName];
                    const operator = propDefinition.required ? ":" : "?:";
                    writer.writeLine(`${propName}${operator} ${propDefinition.type}`);
                }
            });
            writer.writeLine("}");
        }
        const modulePath = path_1.join(rootDir, module.absolutePath) + ".ts";
        fs_1.writeFileSync(modulePath, writer.content);
    }
}
exports.ModuleWriter = ModuleWriter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLXdyaXRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nZW5lcmF0b3IvbW9kdWxlLXdyaXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLCtCQUE2QztBQUM3QywyQkFBbUM7QUFFbkM7SUFBQTtRQUNVLGlCQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLGFBQVEsR0FBRyxFQUFFLENBQUM7UUFLZCxXQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ25DLGFBQVEsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDdEMsU0FBSSxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLElBQUksQ0FBQztRQUMxRCxVQUFLLEdBQUcsQ0FBQyxJQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQzlELGNBQVMsR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFLENBQ2xDLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFbEQsZUFBVSxHQUFHLENBQUMsTUFBa0IsRUFBRSxFQUFFO1lBQ3pDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNkLE1BQU0sRUFBRSxDQUFDO1lBQ1QsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2xCLENBQUMsQ0FBQztRQUVNLGdCQUFXLEdBQUcsR0FBRyxFQUFFO1lBQ3pCLElBQUksUUFBcUMsQ0FBQztZQUUxQyxRQUFRLEdBQUcsQ0FBQyxLQUFhLEVBQUUsRUFBRTtnQkFDM0IsSUFBSSxLQUFLLElBQUksQ0FBQyxF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