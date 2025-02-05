# Interfacing with AI Toolkit using OpenAI's SDK in TypeScript

This repository contains a basic script to run AI models locally. It utilizies Microsoft's [AI Toolkit](https://learn.microsoft.com/en-us/windows/ai/toolkit/toolkit-getting-started) to run models locally on CPU, GPU or NPU.


## Prerequisites

- [pnpm](https://pnpm.io/)
- Visual Studio Code with the AI Toolkit extension installed
- `bash` or `powershell`

To make use of your GPU or NPU you may need to install the AI Toolkit extension in VS Code from Windows, rather than WSL.


## Loading the model

1. Open the extension settings in the left sidebar in VS Code.
2. Open the `Models` catalog.
3. Filter on `Model type` and select `Local run w/ CPU`, `Local run w/ GPU` or `Local run w/ NPU`.
4. Download the model
5. Take note of the model's id by hovering over the model in the `My models` section of the extension.


## Running the script

1. Clone the repository.
2. Run `pnpm install` to install the dependencies.

To run the script, simply execute the following command in a terminal:

In PowerShell (you may need to allow script execution, e.g. by running `Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope User` in
PowerShell with administrator privileges):

```powershell
./bin/run.ps1 [-modelId <model-id>] [-systemMessage <system message>] [-conversationId <conversation id>] [-wrap <wrap at column>] [-language <language>]
```

In bash:

```sh
bash ./bin/run.sh [--model-id <model id>] [--system-message <system message>] [--conversation-id <conversation id>] [--wrap <wrap at column>]
```

The script is configured with the DeepSeek R1 (NPU) model-id by default.

You will be prompted to send a message.


## How it works

The AI Toolkit makes the model available at a REST API endpoint. Since the API is compatible with that of
OpenAI, OpenAI's sdk can be used to interact with the model. See `prompt()` in `src/main.ts` for
an example of calling the API.
