import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const sourceDirectory = path.resolve("dist/examples");
const outputLogsDirectory = path.resolve("src/examples/output/logs");
const outputResponsesDirectory = path.resolve("src/examples/output/responses");
const requestsFile = path.resolve("src/examples/requests.json");

if (!fs.existsSync(requestsFile)) {
    throw new Error(`Requests file does not exist: ${requestsFile}`);
}

const requestsConfig = JSON.parse(fs.readFileSync(requestsFile, "utf8"));

if (!fs.existsSync(sourceDirectory)) {
    throw new Error(`Source directory does not exist: ${sourceDirectory}`);
}

if (!fs.existsSync(outputLogsDirectory)) {
    fs.mkdirSync(outputLogsDirectory);
}

if (!fs.existsSync(outputResponsesDirectory)) {
    fs.mkdirSync(outputResponsesDirectory);
}

function getWithoutAnsi(raw) {
    return raw.replace(
        // matches ANSI escape codes
        /\x1B\[[0-9;]*[A-Za-z]/g, 
        ''
    );
}

async function getReseponseWithRequests(filepath, requests) {
    const serverProcess = spawn("node", [filepath], {
        stdio: ["pipe", "pipe", "pipe"],
        env: {
            ...process.env,
            PORT: "3000"
        }
    });

    let output = "";
    serverProcess.stdout.on("data", d => output += d.toString());
    serverProcess.stderr.on("data", d => output += d.toString());

    let duration = 0;
    
    while (true) {
        if (output.includes("server is running")) {
            break;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
        duration += 100;

        if (duration > 10000) {
            serverProcess.kill("SIGKILL");
            throw new Error(`Server did not start within 10 seconds. Output:\n${output}`);
        }
    }

    const requestLogs = [];

    for (const request of requests) {
        const { method, path: requestPath, body } = request;
        const url = `http://localhost:3000${requestPath}`;
        const response = await fetch(url, {
            method,
            body: body ? JSON.stringify(body) : undefined,
            headers: body ? { "Content-Type": "application/json" } : undefined
        });

        const statusCode = response.status;
        const statusText = response.statusText;

        const isJson = response.headers.get("content-type")?.includes("application/json");
        const responseBody = isJson ? await response.json() : await response.text();
        const responseText = isJson ? JSON.stringify(responseBody, null, 4) : `"${responseBody}"`;

        requestLogs.push(`- ${method} ${requestPath}`);
        requestLogs.push(`${statusCode} ${statusText}`);

        if (body) {
            requestLogs.push(`Body:`);
            requestLogs.push(JSON.stringify(body, null, 4));
            requestLogs.push('Response:');
        }

        requestLogs.push(responseText);
        requestLogs.push('');
    }

    serverProcess.kill("SIGKILL");

    const fileName = path.basename(filepath, ".js");
    const requestsOutputPath = path.join(outputResponsesDirectory, fileName + ".txt");

    fs.writeFileSync(requestsOutputPath, requestLogs.join("\n"), "utf8");

    return output;
}

async function run() {
    const files = fs.readdirSync(sourceDirectory);

    for (const file of files) {
        const isJsFile = file.endsWith(".js");

        if (!isJsFile) {
            continue;
        }

        console.log(`Running example file: ${file}...`);

        const fileName = path.basename(file, ".js");
        const filepath = path.join(sourceDirectory, file);
        const outFile = path.join(outputLogsDirectory, fileName + ".output.txt");

        const requests = requestsConfig[fileName] || [];
        const output = await getReseponseWithRequests(filepath, requests);
        const withoutAnsi = getWithoutAnsi(output);

        fs.writeFileSync(outFile, withoutAnsi, "utf8");

        console.log(`Wrote output to: ${outFile}`);
    }
}

run();
