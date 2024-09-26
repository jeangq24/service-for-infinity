const fs = require('fs');
const path = require('path');
const {server_port, server_host} = require("./getHosts.js");

const readJSONFiles = (directory) => {
    const files = fs.readdirSync(directory);
    return files.map(file => JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')));
};

const combineSwaggerFiles = () => {
    const componentsDir = path.join(__dirname, '../swagger/components');
    const pathsDir = path.join(__dirname, '../swagger/paths');
    const components = readJSONFiles(componentsDir);
    const paths = readJSONFiles(pathsDir);
    const combinedComponents = components.reduce((acc, component) => {
        return {
            ...acc,
            schemas: {
                ...acc.schemas,
                ...component.schemas
            }
        };
    }, {});
    
    const combinedPaths = paths.reduce((acc, route) => ({ ...acc, ...route }), {});

    return {
        definition: {
            openapi: '3.0.0',
            info: {
                title: "Lexart Labs Test",
                version: "1.0.0"
            },
            servers: [
                {
                    url: `${server_host}`,
                    description: 'Developer API REST'
                }
            ],
            components: combinedComponents,
            paths: combinedPaths
        },

        apis: [
            path.join(__dirname, '../swagger/components/*.json'),
            path.join(__dirname, '../swagger/paths/*.json')
        ]
    };
};

module.exports = combineSwaggerFiles;
