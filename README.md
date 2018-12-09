# Directory Structure

#Requirement
    Nodejs : 8 version
    Mocha: to run test cases(5.2.0v)
    
###Assumption
    Input file is valid. If file is invalid code might break
    
######Using this library you can 
    1) Create item or directory
    2) remove directory or item
    3) move directory or item
    
    
######Setup
    const directoryStructure = require("directoryStructure");
    
    const structure = new directoryStructure(<options>);
    
    // options is an object which include
        inputFile: <input file path>
        outputFile: <output file path>
        
        
######To perform operations
    structure.run();
    
    Note: this function returns promise
    


######Example
    1) Input File: create item chocolate
                create dir fruits
    
       Output File: root
                        dir fruits
                        item chocolate   
    2) Input File: create item chocolate
                   create item caramel chocolate
        
       Output File: failed create item caramel chocolate            
