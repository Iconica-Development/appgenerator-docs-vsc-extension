# Appgenerator Docs Extension

This extension is made for the [HydroPlatform repository](https://github.com/SiebeBosch/HydroPlatform). It helps the end user by providing documentation when creating apps in a .yaml or .yml file. 

## Features

### Component documentation
When editing a .yaml or .yml file, a pop-up window with documentation will open when hovering over a key. For instance, when hovering over `button`, the extension will open the documentation for the button in a pop-up window.
<br/>
<img src="https://github.com/Iconica-Development/appgenerator-docs-vsc-extension/blob/master/assets/readme/docs_example.png?raw=true" alt="drawing" width="400"/>

### Auto suggest component variables
When editing the yaml file, this extension will suggest / autocomplete variables for components:
<br/>
<img src="https://github.com/Iconica-Development/appgenerator-docs-vsc-extension/blob/master/assets/readme/autofill_example.png?raw=true" alt="drawing" width="400"/>

## How to use
The docs of a component should be saved as a markdown file in the following location: `translation/{target}/docs/{component_name}.md`. The target should always be specified in the yaml file.

The docs of a button with target flutter should be saved at the location `translation/flutter/docs/button.md`.

## How to install

1. Download the extension through this [link](https://github.com/Iconica-Development/appgenerator-docs-vsc-extension/raw/refs/heads/master/releases/hydro-platform-0.0.2.vsix).
2. Go to the Extensions view.
3. Select Views and More Actions...
4. Select Install from VSIX...
5. Select the extension that was downloaded in step 1.