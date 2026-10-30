const fs = require("fs");
const path = require("path");

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const srcDir = path.resolve(__dirname, "..", "src");
const allFiles = walkDir(srcDir);
let modifiedCount = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, "utf8");
  const regex = /,\s*mode:\s*["']insensitive["'](?:\s+as\s+const)?/g;
  const regexLeading = /mode:\s*["']insensitive["'](?:\s+as\s+const)?,\s*/g;

  if (regex.test(content) || regexLeading.test(content)) {
    content = content.replace(regex, "");
    content = content.replace(regexLeading, "");
    fs.writeFileSync(file, content, "utf8");
    modifiedCount++;
    console.log(`Adapted: ${path.relative(srcDir, file)}`);
  }
}

console.log(`\nSUCCESS: Removed mode: "insensitive" from ${modifiedCount} files.`);
