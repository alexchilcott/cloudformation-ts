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
    const functions = [];
    if (resourceType && typeDefinition) {
        resourceInterfaces.push(resourceType.resource);
        resourceInterfaces.push(resourceType.properties);
        functions.push({
            functionBody: `
export function ${resourceType.resource.name}(properties: Properties): ${resourceType.resource.name} {
  return {
    Type: "${typeDefinition.key}",
    Properties: properties
  };
}`
        });
    }
    const module = type_definition_1.createModule(`/${namespace || "Global"}`, [...resourceInterfaces, ...propertyTypeDefinitions], [], functions);
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
    ], []);
    modules.push(resourceTypesModule);
    return modules;
}
exports.mapSpecToModules = mapSpecToModules;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydC1zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2dlbmVyYXRvci9jb252ZXJ0LXNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFNQSx1REFTMkI7QUFFM0IsTUFBTSxxQkFBcUIsR0FBRyxrQkFBa0IsQ0FBQztBQUVqRCxNQUFNLFdBQVcsR0FBRyxDQUFDLEVBQVMsRUFBRSxFQUFFO0lBQ2hDLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDNUMsQ0FBQyxDQUFDO0FBRUYsMkJBQTJCLFFBQWdCO0lBQ3pDLE9BQU87UUFDTCxRQUFRLEVBQUUsUUFBUTtRQUNsQixlQUFlLEVBQUUsQ0FBQyxFQUFFLGtCQUFrQixFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUM7S0FDckUsQ0FBQztBQUNKLENBQUM7QUFFRCwwQkFBMEIsSUFBc0I7SUFDOUMsUUFBUSxJQUFJLEVBQUU7UUFDWixLQUFLLFFBQVE7WUFDWCxPQUFPLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZDLEtBQUssU0FBUztZQUNaLE9BQU8saUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDeEMsS0FBSyxNQUFNO1lBQ1QsT0FBTyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQyxLQUFLLFNBQVM7WUFDWixPQUFPLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3hDLEtBQUssUUFBUTtZQUNYLE9BQU8saUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdkMsS0FBSyxNQUFNO1lBQ1QsT0FBTyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQyxLQUFLLFdBQVc7WUFDZCxPQUFPLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzFDO1lBQ0UsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDNUI7QUFDSCxDQUFDO0FBRUQsK0JBQ0UsUUFBZ0MsRUFDaEMsbUJBQWdDO0lBRWhDLCtCQUErQixRQUFnQjtRQUM3QyxJQUFJLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNyQyxPQUFPO2dCQUNMO29CQUNFLGtCQUFrQixFQUFFLFNBQVM7b0JBQzdCLE1BQU0sRUFBRSxRQUFRO2lCQUNqQjthQUNGLENBQUM7U0FDSDs7WUFBTSxPQUFPLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBQ0QsSUFBSSxJQUFtQixDQUFDO0lBQ3hCLElBQUksUUFBUSxDQUFDLGFBQWEsRUFBRTtRQUMxQixJQUFJLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0tBQ2pEO1NBQU0sSUFBSSxRQUFRLENBQUMsSUFBSSxJQUFJLE1BQU0sRUFBRTtRQUNsQyxJQUFJLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRTtZQUM5QixNQUFNLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNuRSxJQUFJLEdBQUc7Z0JBQ0wsUUFBUSxFQUFFLFVBQVUsYUFBYSxDQUFDLFFBQVEsR0FBRztnQkFDN0MsZUFBZSxFQUFFO29CQUNmLEdBQUcsYUFBYSxDQUFDLGVBQWU7b0JBQ2hDO3dCQUNFLGtCQUFrQixFQUFFLE9BQU87d0JBQzNCLE1BQU0sRUFBRSxRQUFRO3FCQUNqQjtpQkFDRjthQUNGLENBQUM7U0FDSDthQUFNLElBQUksUUFBUSxDQUFDLFFBQVEsRUFBRTtZQUM1QixNQUFNLGtCQUFrQixHQUFHLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwRSxJQUFJLEdBQUc7Z0JBQ0wsUUFBUSxFQUFFLFVBQVUsUUFBUSxDQUFDLFFBQVEsR0FBRztnQkFDeEMsZUFBZSxFQUFFO29CQUNmO3dCQUNFLGtCQUFrQixFQUFFLE9BQU87d0JBQzNCLE1BQU0sRUFBRSxRQUFRO3FCQUNqQjtvQkFDRCxHQUFHLGtCQUFrQjtpQkFDdEI7YUFDRixDQUFDO1NBQ0g7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUNuQztLQUNGO1NBQU0sSUFBSSxRQUFRLENBQUMsSUFBSSxJQUFJLEtBQUssRUFBRTtRQUNqQyxJQUFJLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRTtZQUM5QixNQUFNLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNuRSxJQUFJLEdBQUc7Z0JBQ0wsUUFBUSxFQUFFLFNBQVMsYUFBYSxDQUFDLFFBQVEsR0FBRztnQkFDNUMsZUFBZSxFQUFFO29CQUNmLEdBQUcsYUFBYSxDQUFDLGVBQWU7b0JBQ2hDO3dCQUNFLGtCQUFrQixFQUFFLE9BQU87d0JBQzNCLE1BQU0sRUFBRSxPQUFPO3FCQUNoQjtpQkFDRjthQUNGLENBQUM7U0FDSDthQUFNLElBQUksUUFBUSxDQUFDLFFBQVEsRUFBRTtZQUM1QixNQUFNLGtCQUFrQixHQUFHLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwRSxJQUFJLEdBQUc7Z0JBQ0wsUUFBUSxFQUFFLFNBQVMsUUFBUSxDQUFDLFFBQVEsR0FBRztnQkFDdkMsZUFBZSxFQUFFO29CQUNmO3dCQUNFLGtCQUFrQixFQUFFLE9BQU87d0JBQzNCLE1BQU0sRUFBRSxPQUFPO3FCQUNoQjtvQkFDRCxHQUFHLGtCQUFrQjtpQkFDdEI7YUFDRixDQUFDO1NBQ0g7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUNuQztLQUNGO1NBQU07UUFDTCxJQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDM0I7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxvQkFBb0IsS0FBYSxFQUFFLElBQVksRUFBRSxPQUFlO0lBQzlELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzNDLElBQUksS0FBSyxLQUFLLEtBQUssRUFBRTtRQUNuQixPQUFPLEtBQUssQ0FBQztLQUNkO1NBQU07UUFDTCxPQUFPLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3pDO0FBQ0gsQ0FBQztBQUVELG1CQUNFLFlBQWdDLEVBQ2hDLGNBQXlFLEVBQ3pFLG1CQUFvRSxFQUNwRSxtQkFBZ0M7SUFLaEMsTUFBTSxTQUFTLEdBQUcsWUFBWSxJQUFJLFVBQVUsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBRXRFLG9DQUFvQyxHQUFXO1FBQzdDLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxNQUFNLFlBQVksR0FBRyxjQUFjO1FBQ2pDLENBQUMsQ0FBQztZQUNFLFFBQVEsRUFBRTtnQkFDUixJQUFJLEVBQUUsMEJBQTBCLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQztnQkFDcEQsVUFBVSxFQUFFO29CQUNWLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLGNBQWMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFO29CQUN6RCxVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7aUJBQ25EO2FBQ0Y7WUFDRCxVQUFVLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFlBQVk7Z0JBQ2xCLFVBQVUsRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7YUFDekQ7U0FDRjtRQUNILENBQUMsQ0FBQyxTQUFTLENBQUM7SUFFZCxrQkFBa0IsVUFFakI7UUFDQyxNQUFNLENBQUMsR0FBMEMsRUFBRSxDQUFDO1FBQ3BELEtBQUssTUFBTSxZQUFZLElBQUksVUFBVSxFQUFFO1lBQ3JDLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMxQyxNQUFNLFlBQVksR0FBRyxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUMxRSxDQUFDLENBQUMsWUFBWSxDQUFDLEdBQUc7Z0JBQ2hCLElBQUksRUFBRSxZQUFZO2dCQUNsQixRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVE7YUFDNUIsQ0FBQztTQUNIO1FBQ0QsT0FBTyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRUQsTUFBTSx1QkFBdUIsR0FBb0MsbUJBQW1CLENBQUMsR0FBRyxDQUN0RixPQUFPLENBQUMsRUFBRTtRQUNSLE1BQU0sbUJBQW1CLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQy9ELE1BQU0sSUFBSSxHQUFHLFNBQVM7WUFDcEIsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNyRCxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUNoQixPQUFPO1lBQ0wsSUFBSTtZQUNKLFVBQVUsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7U0FDbEQsQ0FBQztJQUNKLENBQUMsQ0FDRixDQUFDO0lBRUYsTUFBTSxrQkFBa0IsR0FBRyxFQUFFLENBQUM7SUFDOUIsTUFBTSxTQUFTLEdBQXlDLEVBQUUsQ0FBQztJQUMzRCxJQUFJLFlBQVksSUFBSSxjQUFjLEVBQUU7UUFDbEMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2pELFNBQVMsQ0FBQyxJQUFJLENBQUM7WUFDYixZQUFZLEVBQUU7a0JBQ0YsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLDZCQUNwQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQ3hCOzthQUVPLGNBQWMsQ0FBQyxHQUFHOzs7RUFHN0I7U0FDRyxDQUFDLENBQUM7S0FDSjtJQUVELE1BQU0sTUFBTSxHQUFHLDhCQUFZLENBQ3pCLElBQUksU0FBUyxJQUFJLFFBQVEsRUFBRSxFQUMzQixDQUFDLEdBQUcsa0JBQWtCLEVBQUUsR0FBRyx1QkFBdUIsQ0FBQyxFQUNuRCxFQUFFLEVBQ0YsU0FBUyxDQUNWLENBQUM7SUFDRixPQUFPLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFFLFlBQVksSUFBSSxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDN0UsQ0FBQztBQUVELGlCQUNFLElBQWMsRUFDZCxhQUF3QyxFQUN4QyxZQUFrQztJQUVsQyxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBZSxDQUFDO0lBQ3RDLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFO1FBQ3RCLE1BQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVwQyxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDVixLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ1gsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDN0I7UUFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQy9CO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQWpCRCwwQkFpQkM7QUFFRCwwQkFBaUMsSUFBVztJQUMxQyxNQUFNLE9BQU8sR0FBdUIsRUFBRSxDQUFDO0lBRXZDLE1BQU0sbUJBQW1CLEdBQWEsRUFBRSxDQUFDO0lBQ3pDLE1BQU0saUJBQWlCLEdBQWEsRUFBRSxDQUFDO0lBRXZDLHNCQUFzQixHQUFXO1FBQy9CLG9GQUFvRjtRQUNwRixNQUFNLE9BQU8sR0FBRyw4Q0FBOEMsQ0FBQztRQUMvRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDVixPQUFPLHFCQUFxQixDQUFDO1NBQzlCOztZQUFNLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFRCxNQUFNLG9CQUFvQixHQUFHLE9BQU8sQ0FDbEMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQy9CLFlBQVksRUFDWixHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUNwRCxDQUFDO0lBRUYsTUFBTSxxQkFBcUIsR0FBRyxPQUFPLENBQ25DLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUMvQixZQUFZLEVBQ1osR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FDcEQsQ0FBQztJQUVGLHFFQUFxRTtJQUNyRSxNQUFNLDRCQUE0QixHQUFHLElBQUksR0FBRyxDQUMxQyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FDekUsQ0FBQztJQUVGLE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxDQUFTO1FBQ3BDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMxQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDNUMsQ0FBQyxDQUFDO0lBQ0gsS0FBSyxNQUFNLFNBQVMsSUFBSSxhQUFhLEVBQUU7UUFDckMsTUFBTSxTQUFTLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM1RCxJQUFJLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ3hCLE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLFNBQVMsR0FBRyxDQUFDLENBQUM7U0FDMUU7UUFDRCxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUIsTUFBTSx1QkFBdUIsR0FBRyxTQUFTLENBQ3ZDLFNBQVMsS0FBSyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQzNELFFBQVEsRUFDUixxQkFBcUIsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxFQUMxQyw0QkFBNEIsQ0FDN0IsQ0FBQztRQUNGLE9BQU8sQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0MsSUFBSSx1QkFBdUIsQ0FBQyxnQkFBZ0IsRUFBRTtZQUM1QyxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7Z0JBQ3ZCLGtCQUFrQixFQUFFLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxZQUFZO2dCQUMvRCxNQUFNLEVBQUUsdUJBQXVCLENBQUMsZ0JBQWdCLENBQUMsSUFBSTthQUN0RCxDQUFDLENBQUM7WUFDSCxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdkU7S0FDRjtJQUNELE1BQU0sbUJBQW1CLEdBQUcsOEJBQVksQ0FDdEMsaUJBQWlCLEVBQ2pCLEVBQUUsRUFDRjtRQUNFO1lBQ0UsSUFBSSxFQUFFLDJCQUEyQjtZQUNqQyxXQUFXLEVBQUU7Z0JBQ1gsUUFBUSxFQUFFLGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQ3JDLGVBQWUsRUFBRSxtQkFBbUI7YUFDckM7U0FDRjtLQUNGLEVBQ0QsRUFBRSxDQUNILENBQUM7SUFDRixPQUFPLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDbEMsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQztBQXpFRCw0Q0F5RUMifQ==