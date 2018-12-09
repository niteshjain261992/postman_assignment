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
        fs.mkdir(`${__dirname}/root`, { recursive: true }, (err)=> {
            if (err) throw err;
            resolve();
        });
    });
}

// read input file
function readInput() {
    return new Promise((resolve, reject)=> {
        //ToDO: check input file exists or not
        // todo: validate file
        fs.readFile(__dirname + '/input.txt', { encoding: "utf8" }, (err, data)=> {
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
    if (directory_structure[dir] === 'root') return `${path}/${directories.reverse().join("/")}`;
    else return getDirectoryPath(directory_structure[dir], path, directories);
}

function createItem(command, original_command) {
    return new Promise((resolve, reject)=> {
        const name = command[0];
        const dir = (command[1]) ? command[1] : "root";
        directory_structure[name] = dir;

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
        const dir = (command[1]) ? command[1] : "root";
        directory_structure[name] = dir;

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
        const dir = directory_structure[name];

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

        const old_file_path = `${getDirectoryPath(directory_structure[file_name])}/${file_name}.txt`;
        const new_file_path = `${getDirectoryPath(folder_name)}/${file_name}.txt`;

        fs.rename(old_file_path, new_file_path, (err)=> {
            if (err) throw new Error(original_command);
            directory_structure[file_name] = folder_name;
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

            directory_structure[file_name] = folder2;
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


// get all errors and store that in output.txt
process.on('uncaughtException', (err)=> {
    fs.writeFile('output.txt', `failed ${err.message}`, 'utf8', (err)=> {
        // do nothing
    });
});