export type AwsPrimativeType =
  | "String"
  | "Boolean"
  | "Json"
  | "Integer"
  | "Double"
  | "Long"
  | "Timestamp";

export type AwsUpdateType = "Mutable" | "Immutable";

export interface IAwsPropertyDefinition {
  Documentation: string;
  UpdateType: AwsUpdateType;
  Required: boolean;

  PrimitiveType?: AwsPrimativeType;

  // or
  Type?: "List" | "Map" | string;

  // and if type is list or map, one of:
  ItemType?: string;
  PrimitiveItemType?: AwsPrimativeType;
}

export interface IAwsTypeDefinition {
  Documentation: string;
  Properties: {
    [key: string]: IAwsPropertyDefinition;
  };
}

export interface ISpec {
  PropertyTypes: {
    [key: string]: IAwsTypeDefinition;
  };
  ResourceTypes: {
    [key: string]: IAwsTypeDefinition;
  };
}
