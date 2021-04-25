# Overview
### What is Node-RED?
Node-RED s an implementation of Flow Based Programming (FBP) built on top of Node.js.

The most prominent feature of Node-RED is the web user interface for visually composing functional blocks.  The network/graph of blocks in this user interface is referred to as a **flow**.  This visual **flow** is functional - it is the actual source code; the program; the application.

Node-RED uses a **message**-based programming paradigm; where **messages** propagate through the flow - from one visual block to the next, then the next, and so on.  This is in contrast to traditional **procedural** programming paradigms, where each line of code is sequentially executed by a CPU core - one instruction, then the next instruction, and so on.

#### Roles
There are 2 major roles in this paradigm:

**1: Flow Designers** - high-level/visual programmers

**2. Node Authors** - low-level/node.js programmers

### What is Node-BLUE?
Node-BLUE is a set of tools built on top of Node-RED, in order to address challenges experienced when using Node-RED in professional, production environments.

#### Adapters
Adapters allow node authors to strongly define exactly what inputs, outputs, and error scenarios exist for for the nodes they define - referred to as Node Signatures.  At the flow-level, the flow designer can select exactly which parts of the propagating message will be used as which inputs to a given node, and how the outputs and errors will flow out from the node to be further processed/handled.

The types of inputs and outputs are described using [Schema Inspector](https://schema-inspector.github.io/schema-inspector/) - and defined in the schemas.js file in the root of the project.  If the input that the flow-designer is defining does not match this schema, the input field will turn red indicating an error.

Inputs can be hard-coded, or extracted from the propagating object using **<typical.javascript.object.addressing>**.

Outputs and errors can be routed and rearranged to output ports by dragging and dropping the output to its desired position.  Each output/error can be mapped to an output port, or suppressed by being dragged below the **Drag below here to suppress output** line.

#### Applications, Environments and Source Control
When Node-BLUE is run, it is configured to run a single application (flow), for a single environment, and link with a single git branch.  Many applications, and environments may exist - and all applications and environments share the same underlying node blocks.  So, if you change a node, it changes the node in every application. But if you change the flow diagram in the UI, it just changes the single flow file for that particular *application*.

A button has been created in the UI for pushing changes - to a git branch name configured in the RUNTIME_CONFIG.js file.

**Future Feature Idea:** There should be a way to visually compare "diffs" between different versions of flows - perhaps by coloring deleted nodes as red, added nodes as green, changed nodes as blue, and unchanged nodes as gray.

#### Error Handling
Along with strongly defined outputs for nodes, errors are strongly defined, and can be routed the same way that outputs are routed - ensuring that every scenario is handled.

Every Node-BLUE node has at least 2 error scenarios - Invalid Input and Catch All. These, and other defined errors, can be routed to outputs of the nodes, or suppressed.

Additional error scenarios can be defined as *Error Validation Routes* - which use schema-inspector to match on error objects.

Unrecognized errors are saved to MongoDB, and displayed to the user as "Unrouted Errors".  This encourages the flow designer to define and handle errors explicitly.

When a new *Error Validation Route* is defined, this actually modifies the adapter file, saving the error definition in it.  An *Error Validation Route* can also be deleted by the flow designer, which deletes it from the adapter file.

# Preparation
### Required Dependencies
These should all be installed, and included in your **path** environment variable for access from any folder in your command line.
1. Git
2. Node.js/npm
3. Docker ([Docker Desktop](https://www.docker.com/products/docker-desktop) recommended for Windows environments)
4. Node-RED installed globally (for generating login credentials)
```
npm install -g --unsafe-perm node-red
```

### HIGHLY Recommended Tools
1. [Robo 3T](https://robomongo.org/) - for visualizing MongoDB Data
2. [MongoDB Shell](https://www.mongodb.com/try/download/shell) - for testing MongoDB commands

### Download the Source Code
If you haven't already, download this bad-boy.
```
cd <your.git.workspace>
mkdir node-blue
cd node-blue
git clone https://github.com/Mattnificent/node-blue.git
```

### Configuration
The repo includes a file called **RUNTIME_CONFIG_SAMPLE.js**.

1. Copy this file, and rename the copy **RUNTIME_CONFIG.js**.

    This file selects an application name (which matches a flow file name in the **flows** directory), and an environment name (which matches the **ENV_ID** of a document in the **environments** collection in the environment database (*nodeblue_environments* by default).
    
2. Create an environment database (*nodeblue_environments*, unless you name it differently in **RUNTIME_CONFIG.js**)

    *NOTE: The environment database should be separate from the application database.*
    
```
mongosh
```
^ this opens a MongoDB Shell, if you installed it.
Inside this MongoDB Shell, run the following commands to configure a local environment:
```
use nodeblue_environments
db.environments.insert({
    "ENV_ID" : "local",
    "UI_USERNAME" : "admin",
    "UI_PASSWORD_HASH" : "$2b$08$B5OnMS7wGi72mxSL.QJsdeuZtgoDrtCRUtgKWtX1YFRcbH7C1Fzbe",
    "MONGO__HOST" : "localhost",
    "MONGO__PORT" : "27017",
    "MONGO__DB" : "nodeblue_local",
    "CALENDLY__API_KEY" : "TODO_API_KEY_HERE",
    "RABBITMQ__URL" : "amqp://guest:guest@localhost:5672",
    "INTERCOM__ACCESS_TOKEN" : "TODO_ACCESS_TOKEN_HERE",
    "INTERCOM__APP_ID" : "TODO_APP_ID_HERE",
    "INTERCOM__API_KEY" : "TODO_API_KEY_HERE",
    "ENDPOINT_AUTH__USERNAME" : "admin",
    "ENDPOINT_AUTH__PASSWORD" : "s3cret"
})
```
If you want a password other than **s3cret**, follow the instructions [here](https://nodered.org/docs/user-guide/runtime/securing-node-red#generating-the-password-hash), and update the **UI_PASSWORD_HASH** with the result.  Feel free to change/add/remove any other environment configuration you need for your application(s).

In the future, you can define a production environment with a new document in the environments collection, with `"ENV_ID" : "prod"`, and select it by setting an environment variable `setx ENV_ID prod` on the production environment machine.

# Execution
1. You'll want to open 2 CMD shells with administrator priviledges; both in your local node-blue repo workspace directory.
2. In one, Run the docker containers
```
docker-compose up
```
3. In the other, Run the Node-BLUE application
```
node server
```
4. Navigate to [http://localhost:4004/red](http://localhost:4004/red)

# Epilogue
If you have any questions, comments, issues, suggestions, or contributions - please email me @ [mattbeckondeck@gmail.com](mailto:mattbeckondeck@gmail.com)

Thank you for READINGME!
