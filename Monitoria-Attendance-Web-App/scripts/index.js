const path = require("path");
const $ = require("jquery");
const SerialPort = require("serialport").SerialPort;
const sqlite3 = require("sqlite3").verbose();
const md5 = require("md5");
const base64 = require("base-64");
const { ReadlineParser } = require("@serialport/parser-readline");
const jQuery = $;
const JsBarcode = require("jsbarcode");

require("bootstrap");

window.jQuery = window.$ = $;
$.DataTable = require("datatables.net-bs5")(window, $);

let runtime = {
    port: null,
    serialPort: null,
    serialPortPipe: null,
    interval: null,
    moveToSectionEvent: null,
    db: new sqlite3.Database(path.resolve(__dirname, "./db/main_db.db"))
};

let cache = {
    page: null,
    userId: null,
    prevPorts: []
}

const Modal = {
    showModal: (modal)=> $("#" + modal + "-modal").removeClass("animate__fadeOut").show().addClass("animate__fadeIn"),

    closeModal: (modal)=> {
        $("#" + modal + "-modal").addClass("animate__fadeOut").removeClass("animate__fadeIn");

        setTimeout(()=> {
            $("#" + modal + "-modal").hide();

            for(let id of [
                "add-entity-name",
                "add-entity-username",
                "add-entity-email",
                "add-entity-rfid",
                "add-entity-password",
                "add-entity-password-confirmation",
            ])

            $("#" + id).val("");
        }, 850);
    }
};

const App = {
    moveToSection: (section)=> {
        if(section == cache.page)
            return;

        $("#" + cache.page + "-section").removeClass("animate__slideInDown").addClass("animate__slideOutUp");
        setTimeout(()=> {
            $("#" + cache.page + "-section").addClass("d-none");
            $("#" + section + "-section").removeClass("d-none").removeClass("animate__slideOutUp").addClass("animate__slideInDown");

            $("#" + cache.page + "-nav").removeClass("active");
            $("#" + section + "-nav").addClass("active");

            runtime.moveToSectionEvent();
            runtime.moveToSectionEvent = null;
            cache.page = section;
        }, 1000);
    },

    addEntityModal: ()=> {
        Modal.showModal("add-entity");

        runtime.serialPort = new SerialPort({
            path: runtime.port,
            baudRate: 9600
        });

        runtime.moveToSectionEvent = ()=> runtime.serialPort.close();
        runtime.serialPortPipe = runtime.serialPort.pipe(new ReadlineParser());

        runtime.serialPortPipe.on("data", (data)=> {
            let rfid = data.toString().trim();

            $("#add-entity-no-rfid").addClass("d-none");
            $("#add-entity-rfid-barcode").removeClass("d-none");
            $("#add-entity-rfid").attr("value", rfid);

            JsBarcode("#add-entity-rfid-barcode", rfid, { displayValue: false });
        });
    },

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
        runtime.serialPort.close();
        $("#main-content").addClass("animate__slideOutUp");

        setTimeout(()=> window.location.reload(), 1000);
    },

    processLogin: ()=> {
        let username = $("#username").val(), password = $("#password").val(), port = $("#available-ports option:selected").val();

        $("#login-error-message").addClass("d-none");
        if(!username || username == "") {
            $("#login-error-message").removeClass("d-none");
            $("#login-error-text").html("Username cannot be empty.");

            return;
        }

        if(!/^[a-zA-Z0-9_]+$/.test(username)) {
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
                            runtime.port = port;

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
        runtime.db.serialize(()=> {
            runtime.db.all("SELECT name, date_time, rfid, phone_number, ent_id, is_in FROM logs", (error, attendee_rows)=> {
                if(!error) {
                    for(let attendee_row of attendee_rows)
                        $("#log-table").prepend("<tr><td>" + attendee_row.date_time + "</td><td>" + attendee_row.ent_id + "</td><td>" + attendee_row.phone_number + "</td><td>" + attendee_row.name + "</td></tr>");
                        $('#logs').DataTable({
                            ordering: false
                        });
                }

                runtime.serialPort = new SerialPort({
                    path: runtime.port,
                    baudRate: 9600
                });

                runtime.moveToSectionEvent = ()=> runtime.serialPort.close();
                runtime.serialPortPipe = runtime.serialPort.pipe(new ReadlineParser());

                runtime.serialPortPipe.on("data", (data)=> {
                    let rfid = data.toString().trim();
        
                    runtime.db.all("SELECT name, phone_number, ent_id, is_in FROM accounts WHERE rfid=\"" + rfid + "\"", (err, rows)=> {
                        if(!err) {
                            let date = new Date().toString();

                            date = date.substring(4, date.length);
                            date = date.substring(0, date.indexOf("("));
        
                            runtime.db.run("INSERT INTO logs(name, date_time, rfid, phone_number, ent_id, is_in) VALUES(\"" + rows[0].name + "\", \"" + date + "\", \"" + rfid + "\", \"" + rows[0].phone_number + "\", \"" + rows[0].ent_id + "\", " + (rows[0].is_in == "0" ? "1" : "0") + ")");
                            runtime.db.run("UPDATE accounts SET is_in=" + (rows[0].is_in == "0" ? "1" : "0") + " WHERE rfid=\"" + rfid + "\"");

                            $("#log-table").prepend("<tr><td>" + date + "</td><td>" + rows[0].ent_id + "</td><td>" + rows[0].phone_number + "</td><td>" + rows[0].name + "</td></tr>");
                        }
                    });
                });
            });
        });
    }
};

$(document).ready(()=> App.showSplashScreen());
