import { Schema, Types } from 'mongoose';

export class JoiValidatorGenerator {
    private schema: Schema;
    private moduleName: string;
    private nestedValidators: string[] = [];
    private mainValidators: string[] = [];

    constructor(schema: Schema, moduleName: string) {
        this.schema = schema;
        this.moduleName = moduleName;
    }

    generate(): string {
        let output = `import Joi from 'joi';\n`;
        output += `import { CommonValidator } from '../../common/validator/CommonValidator';\n\n`
        output += `export class ${this.moduleName}Validators extends CommonValidator {\n\n`;

        this.generateJoi('create' + this.moduleName + 'Schema', this.schema.obj);
        output += this.nestedValidators.join('\n');
        output += this.mainValidators.join('\n');
        output += '}\n';

        return output;
    }

    private generateJoi(name: string, schema: any): void {
        let output = `  public static readonly ${name} = Joi.object({\n`;
        for (let key in schema) {
            const attribute = schema[key] as any;
            if (Array.isArray(attribute) || Array.isArray(attribute.type) || attribute.type === Array || attribute.type === Schema.Types.Array) {
                const items = Array.isArray(attribute) ? attribute[0] : attribute.items;
                const validatorName = key + 'Schema';
                this.nestedValidators.push(`  private static readonly ${validatorName} = ${this.generateSubJoi(items)};\n`);
                output += `    ${key}: Joi.array().items(${this.moduleName}Validators.${validatorName}).optional(),\n`;
            } else if ((typeof attribute === 'object' && !attribute.type) || typeof attribute.type === 'object') {
                const validatorName = key + 'Schema';
                this.nestedValidators.push(`  private static readonly ${validatorName} = ${this.generateSubJoi(attribute)};\n`);
                output += `    ${key}: ${this.moduleName}Validators.${validatorName}.optional(),\n`;
            } else {
                output += `    ${key}: ${this.getJoiType(attribute)},\n`;
            }
        }
        output += `  });\n\n`;
        this.mainValidators.push(output);
    }

    private generateSubJoi(schema: any): string {
        let output = 'Joi.object({\n';
        for (let key in schema) {
            const attribute = schema[key] as any;
            output += `    ${key}: ${this.getJoiType(attribute)},\n`;
        }
        output += `  })`;
        return output;
    }

    private getJoiType(attribute: any): string {
        switch (attribute.type) {
            case String:
                return attribute.required ? 'Joi.string().required()' : 'Joi.string().optional()';
            case Number:
                return attribute.required ? 'Joi.number().required()' : 'Joi.number().optional()';
            case Date:
                return attribute.required ? 'Joi.date().required()' : 'Joi.date().optional()';
            case Boolean:
                return attribute.required ? 'Joi.boolean().required()' : 'Joi.boolean().optional()';
            case Schema.Types.ObjectId || Types.ObjectId:
                return attribute.required ? 'Joi.string().required()' : 'Joi.string().optional()';
            default:
                return 'Joi.any()';
        }
    }
}
