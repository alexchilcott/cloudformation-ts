export interface Import {
  moduleAbsolutePath: string;
  symbol: string;
  symbolAlias?: string;
}
export type ModuleTypeReference = {
  typeName: string;
  requiredImports: Import[];
};
export type TypeReference = string | ModuleTypeReference;
export interface PropertyDefinition {
  type: TypeReference;
  required: boolean;
}
export interface TypeScriptInterfaceDefinition {
  name: string;
  extends?: TypeReference;
  properties: { [key: string]: PropertyDefinition };
}
export interface TypeScriptTypeAliasDefinition {
  name: string;
  aliasedType: TypeReference;
}

export interface ModulePropertyDefinition {
  type: string;
  required: boolean;
}

export interface TypeScriptModuleInterfaceDefinition {
  name: string;
  extends?: string;
  properties: { [key: string]: ModulePropertyDefinition };
}
export interface TypeScriptModuleTypeAliasDefinition {
  name: string;
  aliasedType: string;
}
export interface ModuleImport {
  moduleAbsolutePath: string;
  imports: { symbol: string; alias?: string }[];
}
export interface ModuleDefinition {
  imports: ModuleImport[];
  absolutePath: string;
  exportedInterfaces: TypeScriptModuleInterfaceDefinition[];
  exportedTypeAliases: TypeScriptModuleTypeAliasDefinition[];
}
class JsonSet<T> {
  private items: Set<string> = new Set();

  add(item: T): void {
    this.items.add(JSON.stringify(item));
  }

  values(): T[] {
    return Array.from(this.items.values()).map(x => JSON.parse(x));
  }
}
export function createModule(
  absolutePath: string,
  interfaces: TypeScriptInterfaceDefinition[],
  aliases: TypeScriptTypeAliasDefinition[]
): ModuleDefinition {
  const imports: {
    [key: string]: JsonSet<{ symbol: string; alias?: string }>;
  } = {};

  function addImports(newImports: Import[]) {
    for (const i of newImports) {
      if (!imports[i.moduleAbsolutePath]) {
        imports[i.moduleAbsolutePath] = new JsonSet();
      }
      const importSetFromModule = imports[i.moduleAbsolutePath];
      importSetFromModule.add({ symbol: i.symbol, alias: i.symbolAlias });
    }
  }

  function mapTypeReference(t: TypeReference) {
    if (typeof t === "string") {
      return t;
    } else {
      addImports(t.requiredImports);
      return t.typeName;
    }
  }

  function mapProperties(properties: { [key: string]: PropertyDefinition }) {
    const props: { [key: string]: ModulePropertyDefinition } = {};
    for (const propKey in properties) {
      props[propKey] = {
        required: properties[propKey].required,
        type: mapTypeReference(properties[propKey].type)
      };
    }
    return props;
  }

  function mapInterface(
    i: TypeScriptInterfaceDefinition
  ): TypeScriptModuleInterfaceDefinition {
    return {
      name: i.name,
      extends: i.extends ? mapTypeReference(i.extends) : undefined,
      properties: mapProperties(i.properties)
    };
  }

  function mapAlias(
    a: TypeScriptTypeAliasDefinition
  ): TypeScriptModuleTypeAliasDefinition {
    return {
      name: a.name,
      aliasedType: mapTypeReference(a.aliasedType)
    };
  }

  const exportedInterfaces = interfaces.map(mapInterface);
  const exportedTypeAliases = aliases.map(mapAlias);

  const actualImports: ModuleImport[] = [];
  for (const importedModule in imports) {
    const i: ModuleImport = {
      moduleAbsolutePath: importedModule,
      imports: imports[importedModule]
        .values()
        .map(x => ({ symbol: x.symbol, alias: x.alias }))
    };
    actualImports.push(i);
  }

  return {
    absolutePath,
    imports: actualImports,
    exportedInterfaces,
    exportedTypeAliases
  };
}
