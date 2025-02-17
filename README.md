# Appgenerator Docs Extension

This extension is made for the [HydroPlatform repository](https://github.com/SiebeBosch/HydroPlatform). It helps the end user by providing documentation when creating apps in a .yaml or .yml file. 

## Features

### Component template creation
The command `Create Hydro Platform Component` will let the user create a new component for the platform. The user should provide the name and platform after which the template files for the given platform will be created. This will also generate a docs.md and a schema.json that are needed for other features.

### Component documentation
When editing a .yaml or .yml file, a pop-up window with documentation will open when hovering over a key. For instance, when hovering over `button`, the extension will open the documentation for the button in a pop-up window.

#### How to use
The docs of a component should be saved as a markdown file in the following location: `translation/{target}/{component_name}/docs.md`. The target should always be specified in the yaml file.

The docs of a button with target flutter should be saved at the location `translation/flutter/button/docs.md`.

### Yaml schema generation
This extension can generate yaml schemas based on the components in the project. This schema will be automatically applied to .hydro.yaml and .hydro.yml files. A schema will provide autocompletion for components and will check the YAML's file structure.

#### How to use

1. Open the command palette (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows/Linux).
2. Run the command `Hydro Platform: Generate YAML Schema`.

The YAML schema will be generated and automatically applied to all .hydro.yml and .hydro.yaml files. The extension will also run automatically when the property "target" from the object "app" is changed in the YAML file, to a new supported target.



## How to install

1. Download the extension through this [link](https://github.com/Iconica-Development/appgenerator-docs-vsc-extension/raw/refs/heads/master/releases/hydro-platform-0.0.9.vsix).
2. Go to the Extensions view.
3. Select Views and More Actions...
4. Select Install from VSIX...
5. Select the extension that was downloaded in step 1.