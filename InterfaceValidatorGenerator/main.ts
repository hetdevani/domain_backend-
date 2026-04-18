import fs from 'fs';
import path from 'path';
import { InterfaceGenerator } from './InterfaceGenerator';
import { JoiValidatorGenerator } from './JoiValidatorGenerator';

const moduleName = process.argv[2];

class SchemaProcessor {
    private schemaPath: string;
    private interfacePath: string;
    private validatorPath: string;

    constructor(modelName: string) {
        this.schemaPath = `../src/modules/${modelName}/models/${modelName}.ts`;
        this.interfacePath = `../src/modules/${modelName}/interfaces/I${modelName}.ts`;
        this.validatorPath = `../src/modules/${modelName}/validators/${modelName}Validators.ts`;
    }

    async execute() {
        const importedModule = await import(this.schemaPath);
        let keys = Object.keys(importedModule);
        const modelSchema = importedModule[keys[0]].schema;

        const interfaceGenerator = new InterfaceGenerator(modelSchema, keys[0]);
        const joiValidatorGenerator = new JoiValidatorGenerator(modelSchema, keys[0]);

        fs.writeFileSync(path.join(__dirname, this.interfacePath), interfaceGenerator.generate());
        fs.writeFileSync(path.join(__dirname, this.validatorPath), joiValidatorGenerator.generate());
    }
}

(async () => {
    const processor = new SchemaProcessor(
        moduleName
    );
    await processor.execute();
})();
