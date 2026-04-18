import { Schema, Types } from 'mongoose';

export class InterfaceGenerator {
    private moduleName: string;
    private schema: any;
    private nestedInterfaces: string[] = [];

    constructor(schema: any, moduleName: string) {
        this.schema = schema;
        this.moduleName = moduleName;
    }

    generate(): string {
        const mainInterface = `import { Document, Types } from 'mongoose';\n\n`;
        const body = this.generateInterface(`I${this.moduleName}`, this.schema.obj, true);
        return mainInterface + this.nestedInterfaces.join('\n') + body;
    }

    private generateInterface(name: string, schema: any, isMain: boolean = false): string {
        let output = isMain ? `export interface ${name} extends Document {\n` : `export interface ${name} {\n`;
        for (const key in schema) {
            const value = schema[key];
            output += this.getTypeDefinition(key, value);
        }
        output += `}\n\n`;
        return output;
    }

    private getTypeDefinition(key: string, value: any): string {
        if (value.type === String || value.type === Schema.Types.String) {
            return `  ${key}?: string;\n`;
        } else if (value.type === Number || value.type === Schema.Types.Number) {
            return `  ${key}?: number;\n`;
        } else if (value.type === Date || value.type === Schema.Types.Date) {
            return `  ${key}?: Date;\n`;
        } else if (value.type === Boolean || value.type === Schema.Types.Boolean) {
            return `  ${key}?: boolean;\n`;
        } else if (value.type === Array || value.type === Schema.Types.Array || Array.isArray(value) || Array.isArray(value.type)) {
            const arrayItem = Array.isArray(value) ? value[0] : value.items;
            const interfaceName = key.charAt(0).toUpperCase() + key.slice(1);
            this.nestedInterfaces.push(this.generateInterface(interfaceName, arrayItem));
            return `  ${key}?: ${interfaceName}[];\n`;
        } else if (value.type === Schema.Types.ObjectId || value.type === Types.ObjectId) {
            return `  ${key}?: Types.ObjectId;\n`;
        } else if ((typeof value === 'object' && value.type === undefined) || typeof value.type === 'object') {
            const interfaceName = key.charAt(0).toUpperCase() + key.slice(1);
            this.nestedInterfaces.push(this.generateInterface(interfaceName, value));
            return `  ${key}?: ${interfaceName};\n`;
        }
        return `  ${key}?: any; // This type needs to be defined\n`;
    }
}

