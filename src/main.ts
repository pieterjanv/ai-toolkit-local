import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { InternalServerError, OpenAI }from "openai";
import { parseArgs } from "util";

const args = parseArgs({
    options: {
        'conversation-id': {
            type: 'string',
            short: 'c',
        },
        language: {
            type: 'string',
            short: 'l',
        },
        'model-id': {
            type: 'string',
            short: 'm',
        },
        'prompt': {
            type: 'string',
            short: 'p',
        },
        'system-message': {
            type: 'string',
            short: 's',
        },
        wrap: {
            type: 'string',
            short: 'w',
            description: 'Width of the terminal',
            default: '80',
        }
    },
});

if (!args.values['system-message']) {
    args.values['system-message'] = `You are DeepSeek AI, a powerful AI assistant that can help you with a variety of tasks. Make sure to always answer in ${args.values.language || 'English'}.`;
}

const client = new OpenAI({
    baseURL: `http://127.0.0.1:5272/v1`,
    apiKey: '',
});

const textDecoder = new TextDecoder();

const conversationsDir = `${import.meta.dirname}/../conversations`;
if (!existsSync(conversationsDir)) {
    mkdirSync(conversationsDir);
}

const conversationId = args.values['conversation-id'];
const conversationPath = `${conversationsDir}/${conversationId}.json`;

const conversation: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
        role: 'system',
        content: args.values['system-message'],
    },
    ...existsSync(conversationPath)
        ? JSON.parse(readFileSync(conversationPath, 'utf8'))
        : []
];

prompt();

async function prompt() {
    if (!args.values.prompt) {
        console.error('Please provide a prompt using the --prompt flag');
        process.exit(1);
    }

    conversation.push({
        role: 'user',
        content: args.values.prompt.replace(/\r?\n/g, '\n'),
    });

    if (!args.values['model-id']) {
        console.error('Please provide a model ID using the --model-id flag');
        process.exit(1);
    }
    
    try {
        const response = await client.chat.completions.create({
            messages: conversation,
            model: args.values['model-id'],
            stream: true,
            max_completion_tokens: 2048,
            max_tokens: 2048,
        });
    
        await read(response.toReadableStream().getReader());
    }
    catch (error) {
        if (error instanceof InternalServerError) {
            console.error(JSON.stringify(error, null, 2));
            process.exit(1);
        }
        console.error(error);
    }
}

const wrap = Number(args.values.wrap);
if (Number.isNaN(wrap)) {
    console.error('Invalid wrap value');
    process.exit(1);
}

const trimRegexString = `(.{0,${args.values.wrap}})\\s(.+?)$`
const trimRegex = new RegExp(trimRegexString); // captures the sections before and after the last breakpoint if break is possible

// The function that allows us to process to streamed response from the API
async function read(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    content: string = '',
    line = '',
    startTimeMs: number = Date.now(),
) {

	const { value, done } = await reader.read();

	if (done) {
        content += line;
        process.stdout.write(line, 'utf8');
        const timeMs = Date.now() - startTimeMs;
        console.log(`\n\nTotal length: ${content.length} characters in ${timeMs}ms; average speed: ${content.length / (timeMs / 1000)} characters/s`);
        conversation.push({
            role: 'assistant',
            content,
        })
		writeFileSync(conversationPath, JSON.stringify(conversation, null, 2) + '\n');
        return;
	}

    const chunkResponse: OpenAI.ChatCompletion = JSON.parse(textDecoder.decode(value));

    let chunk = chunkResponse.choices[0].message.content;
    if (!chunk) {
        const finishReason = chunkResponse.choices[0].finish_reason;
        if (finishReason === 'length' || finishReason === 'stop') {
            read(reader, content, line, startTimeMs);
            return;
        }
        console.error('Error:', chunkResponse);
        return;
    }

    // What follows is makes sure the output fits within the specified width with line breaks
    // at suitable points.
    // We attach the incomplete line from the previous iterations to the beginning of the chunk
    // to form the addition to be outputted at some point. Next we output all segments of the addition to are
    // complete lines and pass on the remainder to the next iteration.

    let addition = line + chunk.toString().replace(/\r/g, '');
    while (addition.length > 0) {

        const lineBreakIndex = addition.indexOf('\n');
        line = lineBreakIndex === -1 ? addition : addition.slice(0, lineBreakIndex + 1);
        addition = lineBreakIndex === -1 ? '' : addition.slice(lineBreakIndex + 1);

        const trims: string[] = [];
        if (line.length - 1 > wrap) {

            // If there's no breakpoint we have a complete line, so output it
            if (!trimRegex.test(line)) {
                content += `${line}\n`;
                process.stdout.write(`${line}\n`, 'utf8');
                line = '';
                continue;
            }
            // Introduce newline at wrap point
            addition = line.replace(trimRegex, '$1\n$2') + addition;
            // restart
            continue;
        }

        // If there are no additions we have an incomplete line, so we're done
        if (addition.length === 0) {
            break;
        }

        // Output the complete line
        content += `${line}`;
        process.stdout.write(`${line}`, 'utf8');
        line = '';

        // prepend trims to next line, strip any whitespace before an initial newline
        addition = trims.reverse().join('').replace(/^\s+?\n/, '') + addition;
    }

    read(reader, content, line, startTimeMs);
}
