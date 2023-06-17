require("bootstrap");

const $ = require("jquery");
const SerialPort = require('serialport').SerialPort;
const sqlite3 = require('sqlite3').verbose();
const md5 = require("md5");
const base64 = require("base-64");

let runtime = {
    port: null,
    interval: null,
    db: new sqlite3.Database("db/main_db.db")
};

let cache = {
    page: null,
    userId: null,
    prevPorts: []
}

const App = {
    showSplashScreen: (nextContent)=> {
        setTimeout(()=> {
            $("#splash-screen").addClass("animate__fadeOut");
            $("#main-content").removeClass("d-none").addClass("animate__fadeIn");

            setTimeout(()=> {
                $("#login-section").removeClass("d-none").addClass("animate__slideInDown");
                $("#splash-screen").remove();
            }, 800);
            App.loginSection();
        }, 3000);
    },

    loginSection: ()=> {
        runtime.interval = setInterval(()=> {
            let availablePorts = $("#available-ports");

            SerialPort.list()
                .then((ports) => {
                    if(JSON.stringify(cache.prevPorts) === JSON.stringify(ports))
                        return;

                    availablePorts.html("");
                    cache.prevPorts = ports;

                    if(ports.length == 0)
                        availablePorts.append("<option selected disabled>No available port.</option>");
                    else ports.forEach((port)=>
                        availablePorts.append("<option value=\"" + port.path + "\">" + port.friendlyName + "</option>"));
                })
                .catch((err) => availablePorts.append("<option disabled>Cannot read serial ports.</option>"));
        }, 1000);
    },

    logout: ()=> {
        $("#main-content").addClass("animate__slideOutUp");
        setTimeout(()=> window.location.reload(), 800);
    },

    processLogin: ()=> {
        let username = $("#username").val(), password = $("#password").val(), port = $("#available-ports option:selected").val();

        $("#login-error-message").addClass("d-none");
        if(!username || username == "") {
            $("#login-error-message").removeClass("d-none");
            $("#login-error-text").html("Username cannot be empty.");

            return;
        }

        if(/^[a-zA-Z0-9_]+$/.test(username)) {
            $("#login-error-message").removeClass("d-none");
            $("#login-error-text").html("Invalid username string.");

            return;
        }

        if(!password || password == "") {
            $("#login-error-message").removeClass("d-none");
            $("#login-error-text").html("Password cannot be empty.");

            return;
        }

        if(!port || port == "No available port.") {
            $("#login-error-message").removeClass("d-none");
            $("#login-error-text").html("No selected port.");

            return;
        }

        username = base64.encode(username);
        password = base64.encode(md5(password));

        runtime.db.serialize(() => {
            runtime.db.all("SELECT id, username, account_type, password FROM admins WHERE username=\"" + username + "\" AND password=\"" + password + "\"", (err, rows) => {
                if(err) {
                    $("#login-error-message").removeClass("d-none");
                    $("#login-error-text").html("Something went wrong.");
                }
                else {
                    if(rows.length >= 1 && password == rows[0].password) {
                        $("#login-section").removeClass("animate__slideInDown").addClass("animate__slideOutUp");

                        setTimeout(()=> $("#login-section").removeClass("d-flex").addClass("d-none"), 1000);
                        setTimeout(()=> {
                            $("#logs-section").removeClass("d-none").addClass("animate__slideInDown");
                            $("#main-navbar").removeClass("d-none").addClass("animate__slideInDown");

                            setTimeout(()=> $("#main-navbar").addClass("d-block"), 1000);
                            clearInterval(runtime.interval);

                            cache.page = "logs";
                            App.showLogs();
                        }, 1500);
                    }
                    else {
                        $("#login-error-message").removeClass("d-none");
                        $("#login-error-text").html("Invalid username or password.");
                    }
                }
            });
        });
    },

    showLogs: ()=> {

    }
};

$(document).ready(()=> App.showSplashScreen());
