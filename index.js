//dependencies
const fs = require('fs');

const directory_structure = {};

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
        fs.mkdirSync(`${__dirname}/root`);
        resolve();
    });
}

// read input file
function readInput() {
    return new Promise((resolve, reject)=> {
        //ToDO: check input file exists or not
        // todo: validate file
        const input = fs.readFileSync(__dirname + '/input.txt', 'utf8');
        resolve(input);
    });
}

// get directory path recursively using directory structure
function getDirectoryPath(dir="root", path=`${__dirname}/root`, directories=[] /* to push all parent directories*/) {
    // if directory name is root then send default path
    if (dir === 'root') return path;
    if (!directory_structure[dir]) return;

    directories.push(dir);
    if (directory_structure[dir] === 'root') return `${path}/${directories.reverse().join("/")}`;
    else return getDirectoryPath(directory_structure[dir], path, directories);
}

function createItem(command) {
    return new Promise((resolve, reject)=> {
        const name = command[0];
        const dir = (command[1]) ? command[1] : "root";
        directory_structure[name] = dir;

        const path = `${getDirectoryPath(dir)}/${name}.txt`;
        fs.closeSync(fs.openSync(path, 'w'));
        resolve();
    });
}

function createDir(command) {
    return new Promise((resolve, reject)=> {
        const name = command[0];
        const dir = (command[1]) ? command[1] : "root";
        directory_structure[name] = dir;

        const path = `${getDirectoryPath(dir)}/${name}`;
        fs.mkdirSync(path);
        resolve();
    });
}

// function to create directory or item
function createCommand(command) {
    return new Promise(async (resolve, reject)=> {

        // switch case to handle item or directory creation
        switch (command[0]) {
            case 'item':
                await createItem(command.splice(1, command.length));
                break;
            case 'dir':
                await createDir(command.splice(1, command.length));
                break;
        }

        resolve();
    })
}

function deleteItem(command) {
    return new Promise((resolve, reject)=> {
        const name = command[0];
        const dir = directory_structure[name];

        const path = `${getDirectoryPath(dir)}/${name}.txt`;
        delete directory_structure[name];
        fs.unlinkSync(path);

        resolve();
    });
}

function deleteCommand(command) {
    return new Promise(async (resolve, reject)=> {

        // switch case to handle item or directory deletion
        switch (command[0]) {
            case 'item':
                await deleteItem(command.splice(1, command.length));
                break;
            case 'dir':
                const path = `${getDirectoryPath(command[1])}`;
                deleteFolderRecursive(path);
                break;
        }

        resolve();
    });
}

function moveItem(command) {
    return new Promise((resolve, reject)=> {
        const file_name = command[0];
        const folder_name = command[1];

        const old_file_path = `${getDirectoryPath(directory_structure[file_name])}/${file_name}.txt`;
        const new_file_path = `${getDirectoryPath(folder_name)}/${file_name}.txt`;

        fs.renameSync(old_file_path, new_file_path);
        directory_structure[file_name] = folder_name;
        resolve()
    });
}

function moveDir(command) {
    return new Promise((resolve, reject)=> {
        const folder1 = command[0];
        const folder2 = command[1];

        const old_file_path = `${getDirectoryPath(folder1)}`;
        const new_file_path = `${getDirectoryPath(folder2)}/${folder1}`;

        fs.renameSync(old_file_path, new_file_path);
        directory_structure[file_name] = folder2;

        resolve();
    });
}

function moveCommand(command) {
    return new Promise(async (resolve, reject)=> {

        switch (command[0]) {
            case 'item':
                await moveItem(command.splice(1, command.length));
                break;
            case 'dir':
                await moveDir(command.splice(1, command.length));
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
                await createCommand(splitCommand.splice(1, splitCommand.length));
                break;
            case 'delete':
                await deleteCommand(splitCommand.splice(1, splitCommand.length));
                break;
            case 'move':
                await moveCommand(splitCommand.splice(1, splitCommand.length));
                break;
            default:
                // TODo: handle error
        }

        resolve();
    });
}

// start function
(async ()=> {
    try {
        await cleanRootDirectory();
        const input = await readInput();
        const commands = input.split("\n");

        for(let i = 0; i < commands.length; i++) {
            await runCommand(commands[i]);
        }
        console.log(directory_structure);
    } catch(e) {
        // Todo: handle error
    }
})();