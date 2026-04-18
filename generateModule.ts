import { promises as fs } from 'fs';
import path from 'path';

const TEMPLATE_DIR = 'module_templates';

interface ModuleTemplate {
    directory: string;
    filenames: string[];
}

const moduleTemplates: ModuleTemplate[] = [
    { directory: 'controllers', filenames: ['WebUserController.template', 'MobileUserController.template'] },
    { directory: 'services', filenames: ['UserService.template'] },
    { directory: 'dao', filenames: ['UserDAO.template'] },
    { directory: 'interfaces', filenames: ['IUser.template'] },
    { directory: 'models', filenames: ['User.template'] },
    { directory: '', filenames: ['message.template'] },
    { directory: 'routes', filenames: ['indexRoutes.template', 'MobileUserRoutes.template', 'WebUserRoutes.template'] },
    { directory: 'validators', filenames: ['UserValidators.template'] },
];

const replacePlaceholders = (content: string, moduleName: string): string => {
    const moduleVariable = moduleName.charAt(0).toLowerCase() + moduleName.slice(1);
    const moduleVariableUpperCase = moduleName.toUpperCase()
    return content
        .replace(/{{moduleName}}/g, moduleName)
        .replace(/{{moduleVariable}}/g, moduleVariable)
        .replace(/{{moduleVariableUpperCase}}/g, moduleVariableUpperCase);
};

const createDirectoryIfNotExists = async (dirPath: string) => {
    if (!await fs.access(dirPath).catch(() => false)) {
        await fs.mkdir(dirPath, { recursive: true });
    }
};

const processTemplateFile = async (filename: string, directory: string, moduleName: string, outputDirectory: string): Promise<void> => {
    const templatePath = path.join(TEMPLATE_DIR, directory, filename);
    const newFileName = filename.replace('User', moduleName);
    const outputPath = path.join(outputDirectory, directory, newFileName.replace('.template', `.ts`));

    await createDirectoryIfNotExists(path.dirname(outputPath));

    const templateContent = await fs.readFile(templatePath, 'utf8');
    const moduleContent = replacePlaceholders(templateContent, moduleName);

    await fs.writeFile(outputPath, moduleContent, 'utf8');
};

const generateModule = async (moduleName: string, outputDirectory: string): Promise<void> => {
    for (const template of moduleTemplates) {
        for (const filename of template.filenames) {
            await processTemplateFile(filename, template.directory, moduleName, outputDirectory);
        }
    }
    console.log(`Module ${moduleName} generated successfully!`);
};

// Retrieve module name from command line arguments
const moduleName = process.argv[2];
if (!moduleName) {
    console.error("Please provide a module name!");
    process.exit(1);
}

generateModule(moduleName, `./src/modules/${moduleName}`).catch(error => {
    console.error(`Error generating module: ${error.message}`);
});
