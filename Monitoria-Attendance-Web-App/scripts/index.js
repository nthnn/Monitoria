const path = require("path");
const $ = require("jquery");
const sqlite3 = require("sqlite3").verbose();
const md5 = require("md5");
const base64 = require("base-64");
const jQuery = $;
const JsBarcode = require("jsbarcode");

require("bootstrap");

window.jQuery = window.$ = $;
$.DataTable = require("datatables.net-bs5")(window, $);

let runtime = {
    server: "http://192.168.1.1:80",
    interval: null,
    moveToSectionEvent: null,
    db: new sqlite3.Database(path.resolve(__dirname, "./db/main_db.db"))
};

let cache = {
    page: "logs",
    userId: null
}

const Modal = {
    showModal: (modal)=> $("#" + modal + "-modal").removeClass("animate__fadeOut").show().addClass("animate__fadeIn"),

    closeModal: (modal)=> {
        $("#" + modal + "-modal").addClass("animate__fadeOut").removeClass("animate__fadeIn");

        setTimeout(()=> {
            $("#" + modal + "-modal").hide();

            for(let id of [
                "add-entity-name",
                "add-entity-phone-number",
                "add-entity-rfid",
                "add-entity-ent-id"
            ])
                $("#" + id).val("");

            $("#add-entity-no-rfid").removeClass("d-none");
            $("#add-entity-rfid-barcode").addClass("d-none");
        }, 850);
    }
};

const App = {
    moveToSection: (section, fun)=> {
        if(section == cache.page)
            return;

        $("#" + cache.page + "-section").removeClass("animate__slideInDown").addClass("animate__slideOutUp");
        setTimeout(()=> {
            $("#" + cache.page + "-section").addClass("d-none");
            $("#" + section + "-section").removeClass("d-none").removeClass("animate__slideOutUp").addClass("animate__slideInDown");

            $("#" + cache.page + "-nav").removeClass("active");
            $("#" + section + "-nav").addClass("active");
            cache.page = section;

            if(runtime.moveToSectionEvent) {
                runtime.moveToSectionEvent();
                runtime.moveToSectionEvent = null;
            }
            if(fun) fun();
        }, 1000);
    },

    addEntityModal: ()=> {
        Modal.showModal("add-entity");

        $.post(runtime.server + "/read", {}, (data)=> {
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

    loginSection: ()=> { },

    logout: ()=> {
        $("#main-content").addClass("animate__slideOutUp");
        setTimeout(()=> window.location.reload(), 1000);
    },

    processLogin: ()=> {
        let username = $("#username").val(), password = $("#password").val();

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

        $.post(runtime.server + "/check", {}, (data)=> {
            if(data == "OK") {
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
            }
            else {
                $("#login-error-message").removeClass("d-none");
                $("#login-error-text").html("No open Monitoria server.");
            }
        }).fail(()=> {
            $("#login-error-message").removeClass("d-none");
            $("#login-error-text").html("No open Monitoria server.");
        });
    },

    showLogs: ()=> {
        runtime.db.serialize(()=> {
            runtime.db.all("SELECT name, date_time, rfid, phone_number, ent_id, is_in FROM logs", (error, attendee_rows)=> {
                let dataTable = null;
                if(!error && attendee_rows.length >= 0) {
                    $("#log-table").html("");

                    for(let attendee_row of attendee_rows)
                        $("#log-table").prepend("<tr><td>" + attendee_row.date_time + "</td><td>" + attendee_row.ent_id + "</td><td>" + attendee_row.phone_number + "</td><td>" + attendee_row.name + "</td><td>" + (attendee_row.is_in == "0" ? "&#9675;" : "&#9679;") + "</td></tr>");
                        dataTable = $('#logs').DataTable({ order: [0, "desc"] });
                }

                let previousReading = null, resetPreviousID = setInterval(()=> previousReading = null, 5000);
                let readingInterval = setInterval(()=> $.post(runtime.server + "/read", {}, (data)=> {
                    let rfid = data.toString().trim();
                    if(previousReading == rfid)
                        return;
                    
                    previousReading = rfid;
                    runtime.db.all("SELECT name, phone_number, ent_id, is_in FROM accounts WHERE rfid=\"" + rfid + "\"", (err, rows)=> {
                        if(!err && rows.length == 1) {
                            let date = new Date().toString();

                            date = date.substring(4, date.length);
                            date = date.substring(0, date.indexOf("("));
        
                            runtime.db.run("INSERT INTO logs(name, date_time, rfid, phone_number, ent_id, is_in) VALUES(\"" + rows[0].name + "\", \"" + date + "\", \"" + rfid + "\", \"" + rows[0].phone_number + "\", \"" + rows[0].ent_id + "\", " + (rows[0].is_in == "0" ? "1" : "0") + ")");
                            runtime.db.run("UPDATE accounts SET is_in=" + (rows[0].is_in == "0" ? "1" : "0") + " WHERE rfid=\"" + rfid + "\"");

                            dataTable.row.add([date, rows[0].ent_id, rows[0].phone_number, rows[0].name, (rows[0].is_in == "0" ? "&#9675;" : "&#9679;")]);
                            dataTable.draw();
                        }
                    });
                }), 1000);

                runtime.moveToSectionEvent = ()=> {
                    dataTable.destroy();

                    clearInterval(readingInterval);
                    clearInterval(resetPreviousID);
                };
            });
        });
    }
};

$(document).ready(()=> App.showSplashScreen());
