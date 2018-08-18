import {
  AwsPrimativeType,
  IAwsPropertyDefinition,
  IAwsTypeDefinition,
  ISpec
} from "./cloud-formation-spec";
import {
  ModuleDefinition,
  TypeScriptInterfaceDefinition,
  TypeReference,
  createModule,
  ModuleTypeReference,
  PropertyDefinition,
  Import,
  TypeScriptModuleFunctionDefinition
} from "./type-definition";

const globalNamespaceSymbol = "GLOBAL_NAMESPACE";

const assertNever = (it: never) => {
  throw new Error(`Unhandled value: ${it}`);
};

function coreTypeReference(typeName: string): ModuleTypeReference {
  return {
    typeName: typeName,
    requiredImports: [{ moduleAbsolutePath: "/core", symbol: typeName }]
  };
}

function mapPrimitiveType(type: AwsPrimativeType): ModuleTypeReference {
  switch (type) {
    case "String":
      return coreTypeReference("CFString");
    case "Boolean":
      return coreTypeReference("CFBoolean");
    case "Json":
      return coreTypeReference("CFJson");
    case "Integer":
      return coreTypeReference("CFInteger");
    case "Double":
      return coreTypeReference("CFDouble");
    case "Long":
      return coreTypeReference("CFLong");
    case "Timestamp":
      return coreTypeReference("CFTimestamp");
    default:
      return assertNever(type);
  }
}

function mapPropertyTypeToType(
  property: IAwsPropertyDefinition,
  globalPropertyTypes: Set<string>
): TypeReference {
  function getImportsForItemType(itemType: string): Import[] {
    if (globalPropertyTypes.has(itemType)) {
      return [
        {
          moduleAbsolutePath: "/Global",
          symbol: itemType
        }
      ];
    } else return [];
  }
  let type: TypeReference;
  if (property.PrimitiveType) {
    type = mapPrimitiveType(property.PrimitiveType);
  } else if (property.Type == "List") {
    if (property.PrimitiveItemType) {
      const primitiveType = mapPrimitiveType(property.PrimitiveItemType);
      type = {
        typeName: `CFList<${primitiveType.typeName}>`,
        requiredImports: [
          ...primitiveType.requiredImports,
          {
            moduleAbsolutePath: "/core",
            symbol: "CFList"
          }
        ]
      };
    } else if (property.ItemType) {
      const importsForItemType = getImportsForItemType(property.ItemType);
      type = {
        typeName: `CFList<${property.ItemType}>`,
        requiredImports: [
          {
            moduleAbsolutePath: "/core",
            symbol: "CFList"
          },
          ...importsForItemType
        ]
      };
    } else {
      throw new Error("Unhandled case");
    }
  } else if (property.Type == "Map") {
    if (property.PrimitiveItemType) {
      const primitiveType = mapPrimitiveType(property.PrimitiveItemType);
      type = {
        typeName: `CFMap<${primitiveType.typeName}>`,
        requiredImports: [
          ...primitiveType.requiredImports,
          {
            moduleAbsolutePath: "/core",
            symbol: "CFMap"
          }
        ]
      };
    } else if (property.ItemType) {
      const importsForItemType = getImportsForItemType(property.ItemType);
      type = {
        typeName: `CFMap<${property.ItemType}>`,
        requiredImports: [
          {
            moduleAbsolutePath: "/core",
            symbol: "CFMap"
          },
          ...importsForItemType
        ]
      };
    } else {
      throw new Error("Unhandled case");
    }
  } else {
    type = `${property.Type}`;
  }

  return type;
}

function replaceAll(input: string, find: string, replace: string): string {
  const after = input.replace(find, replace);
  if (input === after) {
    return input;
  } else {
    return replaceAll(after, find, replace);
  }
}

function getModule(
  awsNamespace: string | undefined,
  typeDefinition: { key: string; resource: IAwsTypeDefinition } | undefined,
  propertyDefinitions: { key: string; property: IAwsTypeDefinition }[],
  globalPropertyTypes: Set<string>
): {
  module: ModuleDefinition;
  mainResourceType: TypeScriptInterfaceDefinition | undefined;
} {
  const namespace = awsNamespace && replaceAll(awsNamespace, "::", ".");

  function getResourceTypeNameFromKey(key: string) {
    const typeName = replaceAll(key, "::", "");
    return typeName;
  }

  const resourceType = typeDefinition
    ? {
        resource: {
          name: getResourceTypeNameFromKey(typeDefinition.key),
          properties: {
            Type: { type: `"${typeDefinition.key}"`, required: true },
            Properties: { type: "Properties", required: true }
          }
        },
        properties: {
          name: `Properties`,
          properties: mapProps(typeDefinition.resource.Properties)
        }
      }
    : undefined;

  function mapProps(properties: {
    [key: string]: IAwsPropertyDefinition;
  }): { [key: string]: PropertyDefinition } {
    const r: { [key: string]: PropertyDefinition } = {};
    for (const propertyName in properties) {
      const propInfo = properties[propertyName];
      const propertyType = mapPropertyTypeToType(propInfo, globalPropertyTypes);
      r[propertyName] = {
        type: propertyType,
        required: propInfo.Required
      };
    }
    return r;
  }

  const propertyTypeDefinitions: TypeScriptInterfaceDefinition[] = propertyDefinitions.map(
    propDef => {
      const propDefKeyNamespace = replaceAll(propDef.key, "::", ".");
      const name = namespace
        ? propDefKeyNamespace.substring(namespace.length + 1)
        : propDef.key;
      return {
        name,
        properties: mapProps(propDef.property.Properties)
      };
    }
  );

  const resourceInterfaces = [];
  const functions: TypeScriptModuleFunctionDefinition[] = [];
  if (resourceType && typeDefinition) {
    resourceInterfaces.push(resourceType.resource);
    resourceInterfaces.push(resourceType.properties);
    functions.push({
      functionBody: `
export function ${resourceType.resource.name}(properties: Properties): ${
        resourceType.resource.name
      } {
  return {
    Type: "${typeDefinition.key}",
    Properties: properties
  };
}`
    });
  }

  const module = createModule(
    `/${namespace || "Global"}`,
    [...resourceInterfaces, ...propertyTypeDefinitions],
    [],
    functions
  );
  return { module, mainResourceType: resourceType && resourceType.resource };
}

export function groupBy<T>(
  keys: string[],
  groupSelector: ((key: string) => string),
  itemSelector: ((key: string) => T)
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const key of keys) {
    const groupKey = groupSelector(key);

    let group = groups.get(groupKey);
    if (!group) {
      group = [];
      groups.set(groupKey, group);
    }
    group.push(itemSelector(key));
  }
  return groups;
}

export function mapSpecToModules(spec: ISpec): ModuleDefinition[] {
  const modules: ModuleDefinition[] = [];

  const resourceTypeImports: Import[] = [];
  const resourceTypeNames: string[] = [];

  function getNamespace(key: string): string {
    // returns a string of the form AWS::Something::SomethingElse, or the global symbol.
    const nsRegex = /([A-Za-z0-9]*::[A-Za-z0-9]*::[A-Za-z0-9]*).*/;
    const match = key.match(nsRegex);
    if (!match) {
      return globalNamespaceSymbol;
    } else return match[1];
  }

  const resourcesByNamespace = groupBy(
    Object.keys(spec.ResourceTypes),
    getNamespace,
    key => ({ key, resource: spec.ResourceTypes[key] })
  );

  const propertiesByNamespace = groupBy(
    Object.keys(spec.PropertyTypes),
    getNamespace,
    key => ({ key, property: spec.PropertyTypes[key] })
  );

  // Figure out the types that should be found in the global namepsace:
  const globalNamespacePropertyTypes = new Set<string>(
    (propertiesByNamespace.get(globalNamespaceSymbol) || []).map(x => x.key)
  );

  const allNamespaces = new Set<string>([
    ...Array.from(resourcesByNamespace.keys()),
    ...Array.from(propertiesByNamespace.keys())
  ]);
  for (const namespace of allNamespaces) {
    const resources = resourcesByNamespace.get(namespace) || [];
    if (resources.length > 1) {
      throw new Error(`Mulitple resources found for namespace '${namespace}'`);
    }
    const resource = resources[0];
    const convertedResourceModule = getModule(
      namespace === globalNamespaceSymbol ? undefined : namespace,
      resource,
      propertiesByNamespace.get(namespace) || [],
      globalNamespacePropertyTypes
    );
    modules.push(convertedResourceModule.module);
    if (convertedResourceModule.mainResourceType) {
      resourceTypeImports.push({
        moduleAbsolutePath: convertedResourceModule.module.absolutePath,
        symbol: convertedResourceModule.mainResourceType.name
      });
      resourceTypeNames.push(convertedResourceModule.mainResourceType.name);
    }
  }
  const resourceTypesModule = createModule(
    "/resource-types",
    [],
    [
      {
        name: "AwsResourceTypeDefinition",
        aliasedType: {
          typeName: resourceTypeNames.join("|"),
          requiredImports: resourceTypeImports
        }
      }
    ],
    []
  );
  modules.push(resourceTypesModule);
  return modules;
}
