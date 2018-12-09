//dependencies
const fs = require('fs');

const directory_structure = {};
let position = 0;

// to check name of item and directory only have number, alphabet and `-`, `_`
function isValid(name) {
    const pattern = /^[a-zA-Z0-9_-]+$/;
    return name.match(pattern);
}

// delete all files and folders
function deleteFolderRecursive(path=`${__dirname}/root`) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file, index){
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
                delete directory_structure[file];
            }
        });
        fs.rmdirSync(path);
        let directoryName = path.split("/");
        directoryName = directoryName[directoryName.length - 1];
        delete directory_structure[directoryName];
    }
}

// clean up root Directory
function cleanRootDirectory() {
    return new Promise((resolve, reject)=> {
        deleteFolderRecursive();
        fs.mkdir(`${__dirname}/root`, { recursive: true }, (err)=> {
            if (err) throw err;
            resolve();
        });
    });
}

// read input file
function readInput() {
    return new Promise((resolve, reject)=> {
        if (!fs.existsSync(this.inputFilePath)) throw new Error("Input file not exists");
        // todo: validate file
        fs.readFile(this.inputFilePath, { encoding: "utf8" }, (err, data)=> {
            if (err) throw err;
            resolve(data);
        });
    });
}

// get directory path recursively using directory structure
function getDirectoryPath(dir="root", path=`${__dirname}/root`, directories=[] /* to push all parent directories*/) {
    // if directory name is root then send default path
    if (dir === 'root') return path;
    if (!directory_structure[dir]) return;

    directories.push(dir);
    if (directory_structure[dir].path === 'root') return `${path}/${directories.reverse().join("/")}`;
    else return getDirectoryPath(directory_structure[dir].path, path, directories);
}

function createItem(command, original_command) {
    return new Promise((resolve, reject)=> {
        const name = command[0];
        // name of item only have alphabets, numbers and `-`, `_`.
        if (!isValid(name)) throw new Error(original_command);
        const dir = (command[1]) ? command[1] : "root";
        directory_structure[name] = { type: "item", path: dir, position: ++position };

        const path = `${getDirectoryPath(dir)}/${name}.txt`;
        fs.open(path, 'w', (err, fd)=> {
            if (err) throw new Error(original_command);
            fs.closeSync(fd);
            resolve();
        });
    });
}

function createDir(command, original_command) {
    return new Promise((resolve, reject)=> {
        const name = command[0];
        // name of directory only have alphabets, numbers and `-`, `_`.
        if (!isValid(name)) throw new Error(original_command);
        const dir = (command[1]) ? command[1] : "root";
        directory_structure[name] = { type: "dir", path: dir, position: ++position };

        const path = `${getDirectoryPath(dir)}/${name}`;

        fs.mkdir(path, { recursive: true }, (err)=> {
            if (err) throw new Error(original_command);
            resolve();
        });
    });
}

// function to create directory or item
function createCommand(command, original_command) {
    return new Promise(async (resolve, reject)=> {

        // switch case to handle item or directory creation
        switch (command[0]) {
            case 'item':
                await createItem(command.splice(1, command.length), original_command);
                break;
            case 'dir':
                await createDir(command.splice(1, command.length), original_command);
                break;
        }

        resolve();
    })
}

function deleteItem(command, original_command) {
    return new Promise((resolve, reject)=> {
        const name = command[0];
        const dir = directory_structure[name].path;

        const path = `${getDirectoryPath(dir)}/${name}.txt`;
        delete directory_structure[name];
        fs.unlink(path, (err)=> {
            if (err) throw new Error(original_command);
            resolve();
        });
    });
}

function deleteCommand(command, original_command) {
    return new Promise(async (resolve, reject)=> {

        // switch case to handle item or directory deletion
        switch (command[0]) {
            case 'item':
                await deleteItem(command.splice(1, command.length), original_command);
                break;
            case 'dir':
                const path = `${getDirectoryPath(command[1])}`;
                deleteFolderRecursive(path);
                break;
        }

        resolve();
    });
}

function moveItem(command, original_command) {
    return new Promise((resolve, reject)=> {
        const file_name = command[0];
        const folder_name = command[1];

        const old_file_path = `${getDirectoryPath(directory_structure[file_name].path)}/${file_name}.txt`;
        const new_file_path = `${getDirectoryPath(folder_name)}/${file_name}.txt`;

        fs.rename(old_file_path, new_file_path, (err)=> {
            if (err) throw new Error(original_command);

            let new_position = ++position;
            if (command[2]) {
                switch (command[2]) {
                    case 'before':
                        new_position = parseFloat(`${directory_structure[command[3]].position - 1}.${new_position}`);
                        break;
                    case 'after':
                        new_position = parseFloat(`${directory_structure[command[3]].position}.${new_position}`);
                        break;
                }
            }
            directory_structure[file_name] = { type: "item", path: folder_name, position: new_position };
            resolve();
        });
    });
}

function moveDir(command, original_command) {
    return new Promise((resolve, reject)=> {
        const folder1 = command[0];
        const folder2 = command[1];

        const old_file_path = `${getDirectoryPath(folder1)}`;
        const new_file_path = `${getDirectoryPath(folder2)}/${folder1}`;

        fs.rename(old_file_path, new_file_path, (err)=> {
            if (err) throw new Error(original_command);

            directory_structure[folder1] = { type: "dir", path: folder2, position: ++position };
            resolve();
        });

    });
}

function moveCommand(command, original_command) {
    return new Promise(async (resolve, reject)=> {

        switch (command[0]) {
            case 'item':
                await moveItem(command.splice(1, command.length), original_command);
                break;
            case 'dir':
                await moveDir(command.splice(1, command.length), original_command);
                break;
        }

        resolve();
    });
}

// run CRUD operations
function runCommand(command) {
    return new Promise(async (resolve, reject)=> {
        const splitCommand = command.split(" ");

        switch (splitCommand[0]) {
            case 'create':
                await createCommand(splitCommand.splice(1, splitCommand.length), command);
                break;
            case 'delete':
                await deleteCommand(splitCommand.splice(1, splitCommand.length), command);
                break;
            case 'move':
                await moveCommand(splitCommand.splice(1, splitCommand.length), command);
                break;
            default:
                // TODo: handle error
        }

        resolve();
    });
}

function getAllFolderFiles(dir) {
    const files = {};

    Object.keys(directory_structure).forEach((struct)=> {
        if (directory_structure[struct].path === dir && directory_structure[struct].type === "item")
            files[directory_structure[struct].position] = struct;
        else if (directory_structure[struct].path === dir && directory_structure[struct].type === "dir")
            files[parseFloat(`-${directory_structure[struct].position}`)] = struct;
    });
    const returnValues = [];
    Object.keys(files).sort().forEach((file)=> {
        returnValues.push(files[file]);
    });

    return returnValues;
}

// to get output file string
function getOutput(output="root\n", dir='root', tab=1 /* to maintain hierarchy in output file*/) {
    const files = getAllFolderFiles(dir);
    files.forEach((file)=> {
        if (directory_structure[file].type === "dir") {
            let i = 0;
            while (i !== tab) {
                output += "\t";
                i++;
            }

            output += "dir " + getOutput(`${file}\n`, file, ++i);
        } else {
            let i = 0;
            while(i !== tab) {
                output += "\t";
                i++;
            }

            output += `item ${file}\n`;
        }
    });
    return output;
}

// start function

class DirectoryStructureCtrl {

    constructor(options={}) {
        this.inputFilePath = (options.inputFile) ? options.inputFile : __dirname + '/../input.txt';
        this.outputFilePath = (options.outputFile) ? options.outputFile : __dirname + '/../output.txt';
    }

    run() {
        return new Promise(async (resolve, reject)=> {

            await cleanRootDirectory();
            const input = await readInput.call(this);
            const commands = input.split("\n");

            for(let i = 0; i < commands.length; i++) {
                await runCommand(commands[i]);
            }

            const output = getOutput();
            fs.writeFile(this.outputFilePath, output, 'utf8', (err)=> {
                // do nothing
            });

        });
    }
}

module.exports = DirectoryStructureCtrl;


// get all errors and store that in output.txt
process.on('uncaughtException', (err)=> {
    fs.writeFile('output.txt', `failed ${err.message}`, 'utf8', (err)=> {
        // do nothing
    });
});