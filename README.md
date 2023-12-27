# Attack Defense Modeling (ADM) VS Code Extension

This VS Code extension provides syntax highlighting for Attack Defense Modeling (ADM), a [dialect](https://github.com/vinayprograms/adm/blob/main/doc/LANGUAGE.md) of the Gherkin language. ADM tools ([adm-cli](https://github.com/vinayprograms/adm) and [admweb](https://github.com/securitydesign/admweb)) is used to convert attack and defense specifications into a decision graph.

## Features

- Syntax highlighting for ADM files.
- Autocomplete options for `Given`, `When` and `And` statements in ADM files. 
  - See [quick reference card](https://raw.githubusercontent.com/vinayprograms/adm/v0.2/doc/quick-reference-card.png) to understand the statements that would be presented for auto-complete. 
  - For a complete understanding of the ADM language, read the [language guide](https://github.com/vinayprograms/adm/blob/v0.2/doc/LANGUAGE.md).

## Getting Started

### Prerequisites

- Visual Studio Code
- Git

### Installation

1. Clone this repository into your `~/.vscode/extensions` directory.
2. Open an ADM file in VS Code. The syntax highlighting should automatically apply to `.adm` files.
3. If you don't see any highlighting, you may have to run the *Reload Window* command in VS Code.

## Usage

Open any `.adm` file in VS Code to start using the extension. The syntax highlighting will automatically apply to these files.

For those who want to experiment with this extension, [ADDB](https://github.com/securitydesign/addb) contains some ADM files.

## License

This project is licensed under the [MIT License](LICENSE.md).

## Contact

If you have any questions, feel free to open an issue.