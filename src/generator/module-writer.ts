import { ModuleDefinition, TypeReference, Import } from "./type-definition";
import { relative, parse, join } from "path";
import { writeFileSync } from "fs";

class Writer {
  private indentAmount = 0;
  private _content = "";
  public get content() {
    return this._content;
  }

  private indent = () => this.indentAmount++;
  private unindent = () => this.indentAmount--;
  public line = (text: string) => `${this.indentation()}${text}\n`;
  public write = (text: any) => (this._content = this._content + text);
  public writeLine = (line: string) =>
    (this._content = `${this._content}${this.line(line)}`);

  public withIndent = (action: () => void) => {
    this.indent();
    action();
    this.unindent();
  };

  private indentation = () => {
    let indentBy: ((level: number) => string);

    indentBy = (level: number) => {
      if (level == 0) {
        return "";
      } else {
        return "  " + indentBy(level - 1);
      }
    };

    return indentBy(this.indentAmount);
  };
}

export class ModuleWriter {
  writeModule(module: ModuleDefinition, rootDir: string) {
    const writer = new Writer();

    function formatImport(symbol: string, alias?: string) {
      if (alias) {
        return `${symbol} as ${alias}`;
      } else return symbol;
    }

    for (const i of module.imports) {
      const importedSymbols = i.imports.map(s =>
        formatImport(s.symbol, s.alias)
      );

      writer.writeLine(
        `import {${importedSymbols.join(", ")}} from './${relative(
          parse(module.absolutePath).dir,
          i.moduleAbsolutePath
        )}';`
      );
    }

    for (const typeAlias of module.exportedTypeAliases || []) {
      writer.writeLine(
        `export type ${typeAlias.name} = ${typeAlias.aliasedType};`
      );
    }
    for (const exportedInterface of module.exportedInterfaces || []) {
      const extendsClause = exportedInterface.extends
        ? ` extends ${exportedInterface.extends}`
        : "";
      writer.writeLine(
        `export interface ${exportedInterface.name}${extendsClause} {`
      );
      writer.withIndent(() => {
        for (const propName in exportedInterface.properties) {
          const propDefinition = exportedInterface.properties[propName];
          const operator = propDefinition.required ? ":" : "?:";
          writer.writeLine(`${propName}${operator} ${propDefinition.type}`);
        }
      });
      writer.writeLine("}");
    }

    for (const exportedFunction of module.exportedFunctions || []) {
      writer.writeLine(exportedFunction.functionBody);
    }

    const modulePath = join(rootDir, module.absolutePath) + ".ts";

    writeFileSync(modulePath, writer.content);
  }
}
