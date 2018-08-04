"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const type_definition_1 = require("./type-definition");
const globalNamespaceSymbol = "GLOBAL_NAMESPACE";
const assertNever = (it) => {
    throw new Error(`Unhandled value: ${it}`);
};
function coreTypeReference(typeName) {
    return {
        typeName: typeName,
        requiredImports: [{ moduleAbsolutePath: "/core", symbol: typeName }]
    };
}
function mapPrimitiveType(type) {
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
function mapPropertyTypeToType(property, globalPropertyTypes) {
    function getImportsForItemType(itemType) {
        if (globalPropertyTypes.has(itemType)) {
            return [
                {
                    moduleAbsolutePath: "/Global",
                    symbol: itemType
                }
            ];
        }
        else
            return [];
    }
    let type;
    if (property.PrimitiveType) {
        type = mapPrimitiveType(property.PrimitiveType);
    }
    else if (property.Type == "List") {
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
        }
        else if (property.ItemType) {
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
        }
        else {
            throw new Error("Unhandled case");
        }
    }
    else if (property.Type == "Map") {
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
        }
        else if (property.ItemType) {
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
        }
        else {
            throw new Error("Unhandled case");
        }
    }
    else {
        type = `${property.Type}`;
    }
    return type;
}
function replaceAll(input, find, replace) {
    const after = input.replace(find, replace);
    if (input === after) {
        return input;
    }
    else {
        return replaceAll(after, find, replace);
    }
}
function getModule(awsNamespace, typeDefinition, propertyDefinitions, globalPropertyTypes) {
    const namespace = awsNamespace && replaceAll(awsNamespace, "::", ".");
    function getResourceTypeNameFromKey(key) {
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
    function mapProps(properties) {
        const r = {};
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
    const propertyTypeDefinitions = propertyDefinitions.map(propDef => {
        const propDefKeyNamespace = replaceAll(propDef.key, "::", ".");
        const name = namespace
            ? propDefKeyNamespace.substring(namespace.length + 1)
            : propDef.key;
        return {
            name,
            properties: mapProps(propDef.property.Properties)
        };
    });
    const resourceInterfaces = [];
    if (resourceType) {
        resourceInterfaces.push(resourceType.resource);
        resourceInterfaces.push(resourceType.properties);
    }
    const module = type_definition_1.createModule(`/${namespace || "Global"}`, [...resourceInterfaces, ...propertyTypeDefinitions], []);
    return { module, mainResourceType: resourceType && resourceType.resource };
}
function groupBy(keys, groupSelector, itemSelector) {
    const groups = new Map();
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
exports.groupBy = groupBy;
function mapSpecToModules(spec) {
    const modules = [];
    const resourceTypeImports = [];
    const resourceTypeNames = [];
    function getNamespace(key) {
        // returns a string of the form AWS::Something::SomethingElse, or the global symbol.
        const nsRegex = /([A-Za-z0-9]*::[A-Za-z0-9]*::[A-Za-z0-9]*).*/;
        const match = key.match(nsRegex);
        if (!match) {
            return globalNamespaceSymbol;
        }
        else
            return match[1];
    }
    const resourcesByNamespace = groupBy(Object.keys(spec.ResourceTypes), getNamespace, key => ({ key, resource: spec.ResourceTypes[key] }));
    const propertiesByNamespace = groupBy(Object.keys(spec.PropertyTypes), getNamespace, key => ({ key, property: spec.PropertyTypes[key] }));
    // Figure out the types that should be found in the global namepsace:
    const globalNamespacePropertyTypes = new Set((propertiesByNamespace.get(globalNamespaceSymbol) || []).map(x => x.key));
    const allNamespaces = new Set([
        ...Array.from(resourcesByNamespace.keys()),
        ...Array.from(propertiesByNamespace.keys())
    ]);
    for (const namespace of allNamespaces) {
        const resources = resourcesByNamespace.get(namespace) || [];
        if (resources.length > 1) {
            throw new Error(`Mulitple resources found for namespace '${namespace}'`);
        }
        const resource = resources[0];
        const convertedResourceModule = getModule(namespace === globalNamespaceSymbol ? undefined : namespace, resource, propertiesByNamespace.get(namespace) || [], globalNamespacePropertyTypes);
        modules.push(convertedResourceModule.module);
        if (convertedResourceModule.mainResourceType) {
            resourceTypeImports.push({
                moduleAbsolutePath: convertedResourceModule.module.absolutePath,
                symbol: convertedResourceModule.mainResourceType.name
            });
            resourceTypeNames.push(convertedResourceModule.mainResourceType.name);
        }
    }
    const resourceTypesModule = type_definition_1.createModule("/resource-types", [], [
        {
            name: "AwsResourceTypeDefinition",
            aliasedType: {
                typeName: resourceTypeNames.join("|"),
                requiredImports: resourceTypeImports
            }
        }
    ]);
    modules.push(resourceTypesModule);
    return modules;
}
exports.mapSpecToModules = mapSpecToModules;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydC1zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2dlbmVyYXRvci9jb252ZXJ0LXNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFNQSx1REFRMkI7QUFFM0IsTUFBTSxxQkFBcUIsR0FBRyxrQkFBa0IsQ0FBQztBQUVqRCxNQUFNLFdBQVcsR0FBRyxDQUFDLEVBQVMsRUFBRSxFQUFFO0lBQ2hDLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDNUMsQ0FBQyxDQUFDO0FBRUYsMkJBQTJCLFFBQWdCO0lBQ3pDLE9BQU87UUFDTCxRQUFRLEVBQUUsUUFBUTtRQUNsQixlQUFlLEVBQUUsQ0FBQyxFQUFFLGtCQUFrQixFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUM7S0FDckUsQ0FBQztBQUNKLENBQUM7QUFFRCwwQkFBMEIsSUFBc0I7SUFDOUMsUUFBUSxJQUFJLEVBQUU7UUFDWixLQUFLLFFBQVE7WUFDWCxPQUFPLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZDLEtBQUssU0FBUztZQUNaLE9BQU8saUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDeEMsS0FBSyxNQUFNO1lBQ1QsT0FBTyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQyxLQUFLLFNBQVM7WUFDWixPQUFPLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3hDLEtBQUssUUFBUTtZQUNYLE9BQU8saUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdkMsS0FBSyxNQUFNO1lBQ1QsT0FBTyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQyxLQUFLLFdBQVc7WUFDZCxPQUFPLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzFDO1lBQ0UsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDNUI7QUFDSCxDQUFDO0FBRUQs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