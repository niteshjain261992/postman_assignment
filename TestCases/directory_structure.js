const assert = require('assert');
const fs = require('fs');

const directoryStruct = require("../directoryStructure");

describe('Directory structure library test', function () {
    this.timeout(60000);

    beforeEach((done)=> {
        // delete old output file
        if (fs.existsSync(__dirname + "/output.txt"))
            fs.unlinkSync(__dirname + "/output.txt");
        done();
    });


    it("create item and sub-directory", (done)=> {
        const input = `create item chocolate\ncreate dir fruits`;
        fs.writeFile(__dirname + "/input.txt", input, 'utf8', (err)=> {
            new directoryStruct({ inputFile: __dirname + "/input.txt", outputFile: __dirname + "/output.txt" }).run()
                .then(()=> {
                    const output = "root\n\tdir fruits\n\titem chocolate\n";

                    fs.readFile(__dirname + "/output.txt", { encoding: "utf8" }, (err, data)=> {
                        assert.equal(output, data, "Error in creating directory or file");
                        done();
                    });
                })
        });
    });

    it("create item and sub-directory", (done)=> {
        const input = `create item chocolate\ncreate item caramel chocolate`;
        fs.writeFile(__dirname + "/input.txt", input, 'utf8', (err)=> {
            new directoryStruct({ inputFile: __dirname + "/input.txt", outputFile: __dirname + "/output.txt" }).run()
                .catch((e)=> {
                    const output = "failed create item caramel chocolate";

                    fs.readFile(__dirname + "/output.txt", { encoding: "utf8" }, (err, data)=> {
                        assert.equal(output, data, "Directory structure failed");
                        done();
                    });
                })
        });
    });
});