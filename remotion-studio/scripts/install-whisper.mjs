// Installs whisper.cpp + models into ../tools/whisper-cpp (shared by Remotion and HyperFrames)
import path from "node:path";
import { installWhisperCpp, downloadWhisperModel } from "@remotion/install-whisper-cpp";

const to = path.resolve(process.cwd(), "..", "tools", "whisper-cpp");
const version = "1.9.2";
const models = process.argv.slice(2).length ? process.argv.slice(2) : ["base", "large-v3-turbo"];

await installWhisperCpp({ to, version });
for (const model of models) {
  await downloadWhisperModel({ model, folder: to });
}
console.log("whisper.cpp ready at", to);
