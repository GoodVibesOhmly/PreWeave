const {
    config,
} = require("dotenv");

config();

module.exports = // ecosystem.js
{
    "apps": [
        {
            "name": "HttpServer",
            "script": "build/src/server.js", // name of the startup file
            "instances": 1, // number of workers you want to run
            "exec_mode": "cluster", // to turn on cluster mode; defaults to 'fork' mode
            "env": {
                "PORT": "10000", // the port on which the app should listen
                "kill_timeout": 120000,
            },
        },
    ],
};
