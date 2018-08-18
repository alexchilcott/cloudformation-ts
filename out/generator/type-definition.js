"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JsonSet {
    constructor() {
        this.items = new Set();
    }
    add(item) {
        this.items.add(JSON.stringify(item));
    }
    values() {
        return Array.from(this.items.values()).map(x => JSON.parse(x));
    }
}
function createModule(absolutePath, interfaces, aliases, functions) {
    const imports = {};
    function addImports(newImports) {
        for (const i of newImports) {
            if (!imports[i.moduleAbsolutePath]) {
                imports[i.moduleAbsolutePath] = new JsonSet();
            }
            const importSetFromModule = imports[i.moduleAbsolutePath];
            importSetFromModule.add({ symbol: i.symbol, alias: i.symbolAlias });
        }
    }
    function mapTypeReference(t) {
        if (typeof t === "string") {
            return t;
        }
        else {
            addImports(t.requiredImports);
            return t.typeName;
        }
    }
    function mapProperties(properties) {
        const props = {};
        for (const propKey in properties) {
            props[propKey] = {
                required: properties[propKey].required,
                type: mapTypeReference(properties[propKey].type)
            };
        }
        return props;
    }
    function mapInterface(i) {
        return {
            name: i.name,
            extends: i.extends ? mapTypeReference(i.extends) : undefined,
            properties: mapProperties(i.properties)
        };
    }
    function mapAlias(a) {
        return {
            name: a.name,
            aliasedType: mapTypeReference(a.aliasedType)
        };
    }
    const exportedInterfaces = interfaces.map(mapInterface);
    const exportedTypeAliases = aliases.map(mapAlias);
    const exportedFunctions = functions;
    const actualImports = [];
    for (const importedModule in imports) {
        const i = {
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
        exportedTypeAliases,
        exportedFunctions
    };
}
exports.createModule = createModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZS1kZWZpbml0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2dlbmVyYXRvci90eXBlLWRlZmluaXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFvREE7SUFBQTtRQUNVLFVBQUssR0FBZ0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQVN6QyxDQUFDO0lBUEMsR0FBRyxDQUFDLElBQU87UUFDVCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELE1BQU07UUFDSixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqRSxDQUFDO0NBQ0Y7QUFDRCxzQkFDRSxZQUFvQixFQUNwQixVQUEyQyxFQUMzQyxPQUF3QyxFQUN4QyxTQUErQztJQUUvQyxNQUFNLE9BQU8sR0FFVCxFQUFFLENBQUM7SUFFUCxvQkFBb0IsVUFBb0I7UUFDdEMsS0FBSyxNQUFNLENBQUMsSUFBSSxVQUFVLEVBQUU7WUFDMUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsRUFBRTtnQkFDbEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7YUFDL0M7WUFDRCxNQUFNLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUMxRCxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7U0FDckU7SUFDSCxDQUFDO0lBRUQsMEJBQTBCLENBQWdCO1FBQ3hDLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxFQUFFO1lBQ3pCLE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7YUFBTTtZQUNMLFVBQVUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDOUIsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDO1NBQ25CO0lBQ0gsQ0FBQztJQUVELHVCQUF1QixVQUFpRDtRQUN0RSxNQUFNLEtBQUssR0FBZ0QsRUFBRSxDQUFDO1FBQzlELEtBQUssTUFBTSxPQUFPLElBQUksVUFBVSxFQUFFO1lBQ2hDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRztnQkFDZixRQUFRLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVE7Z0JBQ3RDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDO2FBQ2pELENBQUM7U0FDSDtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELHNCQUNFLENBQWdDO1FBRWhDLE9BQU87WUFDTCxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUk7WUFDWixPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO1lBQzVELFVBQVUsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztTQUN4QyxDQUFDO0lBQ0osQ0FBQztJQUVELGtCQUNFLENBQWdDO1FBRWhDLE9BQU87WUFDTCxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUk7WUFDWixXQUFXLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztTQUM3QyxDQUFDO0lBQ0osQ0FBQztJQUVELE1BQU0sa0JBQWtCLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUN4RCxNQUFNLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbEQsTUFBTSxpQkFBaUIsR0FBRyxTQUFTLENBQUM7SUFFcEMsTUFBTSxhQUFhLEdBQW1CLEVBQUUsQ0FBQztJQUN6QyxLQUFLLE1BQU0sY0FBYyxJQUFJLE9BQU8sRUFBRTtRQUNwQyxNQUFNLENBQUMsR0FBaUI7WUFDdEIsa0JBQWtCLEVBQUUsY0FBYztZQUNsQyxPQUFPLEVBQUUsT0FBTyxDQUFDLGNBQWMsQ0FBQztpQkFDN0IsTUFBTSxFQUFFO2lCQUNSLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDcEQsQ0FBQztRQUNGLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkI7SUFFRCxPQUFPO1FBQ0wsWUFBWTtRQUNaLE9BQU8sRUFBRSxhQUFhO1FBQ3RCLGtCQUFrQjtRQUNsQixtQkFBbUI7UUFDbkIsaUJBQWlCO0tBQ2xCLENBQUM7QUFDSixDQUFDO0FBakZELG9DQWlGQyJ9