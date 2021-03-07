#!/usr/bin/env node

"use strict";

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const data = process.argv[2];
const platform = process.argv[3];

if (!data) {
  console.error("need data");
  process.exit(1);
}

if (!platform) {
  console.error("need platform");
  process.exit(1);
}

console.log("downloading platform")

console.log("reading data");
const prods = JSON.parse(fs.readFileSync(process.argv[2])).prods;
console.log("done reading data");

const matchingProds = [];

console.log("searching data");
for (const id in prods) {
  const prod = prods[id];
  if (Object.values(prod.platforms).findIndex(({ name }) => name === platform) >= 0) {
    matchingProds.push(prod);
  }
}
console.log("done searching data");

if (matchingProds.length === 0) {
  console.log("no matching prods");
  process.exit(0);
}

console.log("saving prods")

function download(downloadUrl, shellFilePath) {
  if (fs.existsSync(shellFilePath)) {
    console.log(`skipping downloading, path exists: ${shellFilePath}`);
    return true;
  }

  console.log(`downloading: ${downloadUrl} to ${shellFilePath}`);

  try {
    childProcess.execSync(`curl -L -sS '${downloadUrl}' -o '${shellFilePath}'`);
    console.log(`done downloading: ${shellFilePath}`);
  } catch (error) {
    console.error(`error downloading: ${shellFilePath}`);
    try {
      fs.rmSync(shellFilePath);
    } catch (error) {
      // Do nothing
    }
    return false;
  }

  return true;
}

function getFileType(filePath) {
  const fileOutput = String(childProcess.execSync(`file '${filePath}'`));

  if (fileOutput.search(/: HTML/) >= 0) {
    return "html";
  } else if (fileOutput.search(/: (Zip|RAR)/) >= 0) {
    return "zip";
  } else if (fileOutput.search(/:.* ROM[ :]/) >= 0) {
    return "rom";
  }

  return "unknown";
}

Object.values(matchingProds).map(({
  name,
  type: _demoType,
  groups: [{ name: groupName } = {}],
  releaseDate,
  download: downloadUrl
}) => {
  if (!downloadUrl) {
    console.log(`skipping downloading: ${name}`);
    return;
  }

  const demoType = _demoType ? _demoType.split(",")[0] : "unknown";

  const parentName = [releaseDate, groupName, name].filter(v => v).join(' - ');
  const parentPath = path.join("demos", platform, demoType, parentName);

  const downloadName = path.basename(downloadUrl);
  const downloadPath = path.join(parentPath, downloadName);

  const shellParentPath = parentPath.replace(/'/g, "_");
  const shellDownloadName = downloadName.replace(/'/g, "_");
  const shellDownloadPath = downloadPath.replace(/'/g, "_");

  if (!fs.existsSync(parentPath)) {
    fs.mkdirSync(parentPath, { recursive: true });
  }

  if (!download(downloadUrl, shellDownloadPath)) {
    return;
  }

  if (!fs.existsSync(shellDownloadPath)) {
    console.log(`skipping extract, path not found: ${shellDownloadPath}`);
    return;
  }

  let fileType = getFileType(shellDownloadPath);

  if (fileType === "html") {
    console.log(`found html download: ${name}`);

    const htmlOutput = String(fs.readFileSync(shellDownloadPath));

    const [newDownloadUrl] = htmlOutput.match(/https:\/\/files\.scene\.org\/get[^']+/) || [];

    if (!newDownloadUrl) {
      console.log(`skipping download, scene download link not found: ${shellDownloadPath}`);
      return;
    }

    const htmlPath = `${shellDownloadPath}.html`;
    fs.renameSync(shellDownloadPath, htmlPath);

    if (!download(newDownloadUrl, shellDownloadPath)) {
      return;
    }

    fileType = getFileType(shellDownloadPath);

    if (!fs.existsSync(shellDownloadPath)) {
      console.log(`skipping extract, path not found: ${shellDownloadPath}`);
      return;
    }
  }

  if (fileType === "zip") {
    console.log(`extracting: ${shellDownloadPath}`);
    try {
      childProcess.execSync(`7z x '${shellDownloadName}'`, { cwd: shellParentPath });
      console.log(`done extracting: ${shellDownloadPath}`);
    } catch (error) {
      console.error(`error extracting: ${shellDownloadPath}`);
    }
  } else {
    console.log(`skipping extracting, found ${fileType}: ${shellDownloadPath}`);
  }
});

console.log("done saving prods")

console.log("done downloading platform")
