module.exports = {
    apps : [
        {
            name: "myapp",
            script: "./app.js",
            watch: true,
            env: {
                "NODE_ENV": "development",
                "PORT": "8000",
                "MOODLE_KEY": "moodle",
                "MOODLE_SECRET": "vK3y5on1fL8AhHz1AxLE4cj2AdEe8aks",
                "LTI_KF_KEY": "7m7vomkM6flBZyizKbUDCFsYH7VhmXmv",
                "MONGODB_URI": "mongodb://localhost/kf6-tact-dev",
                "ATTACHMENTS_PATH": "development",
                "LOGDIR": "/opt/kf6-tact-source-dev/kf6-tact/logs",

            }
        }
    ]
}
