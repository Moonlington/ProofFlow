# ProofFlow
SEP Group 12 - 2024 - ProofFlow


## Introduction
ProofFlow is an abstract editor designed to help users in writing mathematical proofs,
with the help of theorem prover languages such as Coq and Lean4 using the Language Server Protocol. It works as a standalone editor,
but additional repositories are necessary to be installed in order for features such as language support and VS Code support to function; refer to the section
**Supporting Repositories** for more information.

## Pre-requisites:
Before building ProofFlow on a device the following software is required to be installed:
1. Node package manager (npm)
    - Download `Node.js` from: https://nodejs.org/
    - Run the downloaded installer.
    - Verify the installation by typing this inside a command prompt:

```
npm -v
```
If the version of `npm` is displayed, it is installed correctly:


2. Visual studio code
    - Download Visual Studio Code from: https://code.visualstudio.com
    - Run the downloaded installer.
    - Open up Visual Studio Code to verify it is working correctly.


3. Git
    - Download `Git` from: https://git-scm.com/
    - Run the downloaded installer.
    - After installing, open a command prompt and type:

```
git –version
```
The version number is displayed
if `Git` was installed correctly



## How to use ProofFlow on the browser:

Clone the repository for ProofFlow browser version by running the following command:
```
git clone https://github.com/Moonlington/ProofFlow.git
```
Navigate to the directory by running the following command:
```
cd ProofFlow
```
To install the node dependencies of ProofFlow the following command must be
run:
```
npm install
```
The program can be built and deployed locally with the command:
```
npm run dev
``` 
Afterwards the application can be run by opening Chrome or Firefox and entering the URL `http://localhost:5173/`
into the address bar

## Supporting Repositories:

To use ProofFlow with the language server, follow the steps listed here:

[ProofFlow LSP repository](https://github.com/jochem06/Proofflow-lsp.git)

To use ProofFlow as a VS Code extension, follow the steps listed here:

[ProofFlow VS Code repository](https://github.com/kaa-vz/ProofFlowExtension.git)

## Files to be checked for Code Quality Assesment:

All `TypeScript` files (`xxx.ts`) in the `src` directory, excluding any styling or asset files in the `src/ProofFlow/assets` and `src/styles`







