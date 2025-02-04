# Flow Test Generator

## Description

Flow Test Generator is a Chrome extension that helps you generate test scripts for your web applications. By selecting a test framework and providing a prompt, you can quickly generate test scripts for the current tab's HTML content. The extension supports multiple test frameworks and provides syntax-highlighted responses.

## Table of Contents

- [Description](#description)
- [Table of Contents](#table-of-contents)
- [Repository Structure](#repository-structure)
- [How to Install](#how-to-install)

## Repository Structure

Flow-Test-Generator/
├── images/
│ ├── flow-logo.png
│ └── loading.gif
├── libs/
│ ├── highlight.min.js
│ ├── javascript.min.js
│ └── markdown-it.min.js
├── styles/
│ └── popup.css
├── background.js
├── content.js
├── manifest.json
├── popup.html
├── popup.js
└── README.md

## How to Install

1. Clone the repository to your local machine:

   ```sh
   git clone https://github.com/your-username/Flow-Test-Generator.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" by toggling the switch in the top right corner.
4. Click on the "Load unpacked" button and select the directory where you cloned the repository.
5. The Flow Test Generator extension should now be installed and visible in your Chrome extensions toolbar.
6. Click on the Flow Test Generator icon in the toolbar to open the extension popup.
7. Select a test framework from the dropdown, enter your prompt, and click "Generate Tests" to generate test scripts for the current tab's HTML content.

This `README.md` file provides a description of the extension, a table of contents, the repository structure, and instructions on how to install the extension.
