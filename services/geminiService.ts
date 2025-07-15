
import { GoogleGenAI, Type } from "@google/genai";
import { AIOperation, ProjectFile } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const formatProjectForPrompt = (files: ProjectFile[]): string => {
    if (files.length === 0) {
        return "The project is currently empty.";
    }
    return files.map(file => 
        `// FILE: ${file.path}\n\n${file.content}\n\n// END OF FILE: ${file.path}`
    ).join('\n\n---\n\n');
};

const getOperationConfig = (operation: AIOperation, files: ProjectFile[], userRequest: string) => {
    const projectContext = formatProjectForPrompt(files);
    let systemInstruction = "";
    let userPrompt = "";
    let config: any = { model: 'gemini-2.5-flash' };

    switch (operation) {
        case AIOperation.EXPLAIN:
            systemInstruction = "You are an expert software engineer. Your task is to explain the provided code.";
            userPrompt = `Please explain the following code project. Provide a high-level overview of the project's purpose and architecture, then give a file-by-file breakdown explaining the role of each file. Format your response in markdown.\n\nProject Files:\n${projectContext}`;
            break;

        case AIOperation.REFACTOR:
            systemInstruction = "You are a world-class software engineer specializing in code refactoring. Your goal is to improve code quality, performance, and maintainability while preserving functionality.";
            userPrompt = `Refactor the following project. Analyze all files and provide a complete, updated version of any files that are changed. Do not omit any code. Respond with a JSON object containing a 'summary' of changes and a 'files' list, where each file object has a 'path' and 'content'. If a file is unchanged, you may omit it from the list. The user's specific request is: "${userRequest}"\n\nProject Files:\n${projectContext}`;
            config.config = {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: "A brief summary of the changes made." },
                        files: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    path: { type: Type.STRING },
                                    content: { type: Type.STRING }
                                },
                                required: ["path", "content"]
                            }
                        }
                    }
                }
            };
            break;

        case AIOperation.DEBUG:
            systemInstruction = "You are a meticulous debugging expert. You can find and fix any issue in any codebase.";
            userPrompt = `Analyze the following project for bugs, logic errors, or performance issues based on the user's report. Provide a JSON object containing a 'diagnosis' of the problem and a 'files' array with the corrected code for any changed files. The user reports: "${userRequest}"\n\nProject Files:\n${projectContext}`;
            config.config = {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        diagnosis: { type: Type.STRING, description: "A detailed explanation of the bug and the fix." },
                        files: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    path: { type: Type.STRING },
                                    content: { type: Type.STRING }
                                },
                                required: ["path", "content"]
                            }
                        }
                    }
                }
            };
            break;

        case AIOperation.GENERATE:
            systemInstruction = "You are a powerful project generation engine. You can create entire multi-file projects from a single description. You must respond with a valid JSON object containing an array of file objects, each with a 'path' and 'content'.";
            userPrompt = `Generate a new project based on the following description. Create all necessary files, including HTML, CSS, JavaScript, TypeScript, package.json, etc. Ensure the file paths are logical (e.g., use a 'src' directory). The user's request is: "${userRequest}"`;
            config.config = {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            path: { type: Type.STRING, description: "The full path of the file, e.g., 'src/index.js'." },
                            content: { type: Type.STRING, description: "The complete source code or content of the file." }
                        },
                        required: ["path", "content"]
                    }
                }
            };
            break;

        default:
            throw new Error(`Unknown AI operation: ${operation}`);
    }

    config.contents = userPrompt;
    if (systemInstruction) {
        if (!config.config) config.config = {};
        config.config.systemInstruction = systemInstruction;
    }

    return config;
};

export const runAIAssistant = async (operation: AIOperation, files: ProjectFile[], userRequest: string): Promise<string> => {
    try {
        const generationConfig = getOperationConfig(operation, files, userRequest);
        const response = await ai.models.generateContent(generationConfig);
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`SYSTEM_ERROR: Failed to get response from AI: ${error.message}`);
        }
        throw new Error("SYSTEM_ERROR: An unknown error occurred while communicating with the AI.");
    }
};
