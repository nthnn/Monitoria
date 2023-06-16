require("bootstrap");

const $ = require("jquery");
const SerialPort = require('serialport').SerialPort;
const sqlite3 = require('sqlite3').verbose();
const md5 = require("md5");

let runtime = {
    port: null,
    db: new sqlite3.Database("db/main_db.db")
};

let cache = {
    userId: null,
    prevPorts: []
}

const App = {
    showSplashScreen: (nextContent)=> {
        setTimeout(()=> {
            $("#splash-screen").addClass("animate__fadeOut");
            $("#main-content").removeClass("d-none").addClass("animate__fadeIn");

            setTimeout(()=> $("#login-section").removeClass("d-none").addClass("animate__slideInDown"), 800);
            App.loginSection();
        }, 3000);
    },

    loginSection: ()=> {
        setInterval(()=> {
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

    processLogin: ()=> {
        runtime.db.serialize(() => {
            runtime.db.all('SELECT id, name, rfid FROM accounts', (err, rows) => {
                if(err) {
                } else {
                    $("#login-section").removeClass("animate__slideInDown").addClass("animate__slideOutUp");

                    setTimeout(()=> $("#login-section").addClass("d-none"), 800);
                    setTimeout(()=> {
                        $("#logs-section").removeClass("d-none").addClass("animate_fadeIn");
                        $("#main-navbar").removeClass("d-none").addClass("animate__slideInDown");
                    }, 1000);
                }
              });
        });
    }
};

$(document).ready(()=> App.showSplashScreen());
