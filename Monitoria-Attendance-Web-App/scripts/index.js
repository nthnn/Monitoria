const path = require("path");
const $ = require("jquery");
const sqlite3 = require("sqlite3").verbose();
const md5 = require("md5");
const base64 = require("base-64");
const jQuery = $;
const JsBarcode = require("jsbarcode");

window.jQuery = window.$ = $;
$.DataTable = require("datatables.net-bs5")(window, $);

let runtime = {
    server: "http://192.168.1.1:80",
    username: null,
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

        if(runtime.moveToSectionEvent) {
            runtime.moveToSectionEvent();
            runtime.moveToSectionEvent = null;
        }

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
    },

    messageModal: (title, message)=> {
        $("#message-modal-title").html(title);
        $("#message-modal-message").html(message);

        Modal.showModal("message");
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

            if(runtime.moveToSectionEvent && runtime.moveToSectionEvent != null) {
                runtime.moveToSectionEvent();
                runtime.moveToSectionEvent = null;
            }
            if(fun) fun();
        }, 1000);
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

    processSettingsSave: ()=> {
        let username = $("#settings-username").val(),
            oldPassword = $("#settings-password").val(),
            newPassword = $("#settings-new-password").val(),
            confirmPassword = $("#settings-new-password-confirm").val();

        $("#settings-error-alert").addClass("d-none");
        $("#settings-saved").addClass("d-none");

        runtime.moveToSectionEvent = ()=> {
            $("#settings-error-alert").addClass("d-none");
            $("#settings-saved").addClass("d-none");

            for(let id of ["#settings-username",
                "#settings-password",
                "#settings-new-password",
                "#settings-new-password-confirm"])
                $(id).val("");
        };

        if(!username || username == "") {
            $("#settings-error-alert")
                .removeClass("d-none")
                .html("Username cannot be empty.");

            return;
        }

        if(!/^[a-zA-Z0-9_]+$/.test(username)) {
            $("#settings-error-alert")
                .removeClass("d-none")
                .html("Invalid username string.");

            return;
        }

        if(!oldPassword || oldPassword == "") {
            $("#settings-error-alert")
                .removeClass("d-none")
                .html("Password cannot be empty.");

            return;
        }

        if(!newPassword || newPassword == "") {
            $("#settings-error-alert")
                .removeClass("d-none")
                .html("New password cannot be empty.");

            return;
        }

        if(!confirmPassword || confirmPassword == "") {
            $("#settings-error-alert")
                .removeClass("d-none")
                .html("Password confirmation cannot be empty.");

            return;
        }

        if(newPassword != confirmPassword) {
            $("#settings-error-alert")
                .removeClass("d-none")
                .html("Password confirmation did not match.");

            return;
        }

        username = base64.encode(username);
        oldPassword = base64.encode(md5(oldPassword));
        newPassword = base64.encode(md5(newPassword));

        runtime.db.serialize(() => {
            runtime.db.all("SELECT * FROM admins WHERE id=" + cache.userId + " AND password=\"" + oldPassword + "\"", (err, rows) => {
                if(err) $("#settings-error-alert").removeClass("d-none").html("Something went wrong.");
                else {
                    if(rows.length == 1) {
                        runtime.db.run("UPDATE admins SET username=\"" + username + "\", password=\"" + newPassword + "\" WHERE id=\"" + cache.userId + "\" AND password=\"" + oldPassword + "\"");
                        $("#settings-saved").removeClass("d-none");

                        runtime.username = base64.decode(username);
                    }
                    else $("#settings-error-alert").removeClass("d-none").html("Incorrect old password.");
                }
            });
        });
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

                                    cache.userId = rows[0].id;
                                    runtime.username = base64.decode(username);

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

    showSettings: ()=> {
        $("#settings-error-alert").addClass("d-none");
        $("#settings-username").val(runtime.username);
    },

    showLogs: ()=> {
        runtime.db.serialize(()=> {
            runtime.db.all("SELECT name, date_time, rfid, phone_number, ent_id, is_in FROM logs", (error, attendee_rows)=> {
                let dataTable = null;
                if(!error && attendee_rows.length >= 0) {
                    $("#log-table").html("");

                    for(let attendee_row of attendee_rows)
                        $("#log-table").prepend("<tr><td>" + attendee_row.date_time + "</td><td>" + attendee_row.ent_id + "</td><td>" + attendee_row.phone_number + "</td><td>" + attendee_row.name + "</td><td>" + (attendee_row.is_in == "0" ? "&#9898;" : "&#9899;") + "</td></tr>");
                        dataTable = $('#logs').DataTable({ order: [0, "desc"] });
                }

                let previousReading = null,
                    resetReading = ()=> previousReading = null,
                    resetPreviousID = setInterval(resetReading, 6000);

                let readingInterval = setInterval(()=> $.post(runtime.server + "/read", {}, (data)=> {
                    let rfid = data.toString().trim();

                    $("#disconnected-error").addClass("d-none");
                    if(previousReading == rfid)
                        return;
                    
                    previousReading = rfid;
                    resetPreviousID = setInterval(resetReading, 6000);

                    runtime.db.all("SELECT name, phone_number, ent_id, is_in FROM accounts WHERE rfid=\"" + rfid + "\"", (err, rows)=> {
                        if(!err && rows.length == 1) {
                            let date = new Date().toString();
                            let entityName = rows[0].name, entityId = rows[0].ent_id, entityPhoneNumber = rows[0].phone_number;

                            date = date.substring(4, date.length);
                            date = date.substring(0, date.indexOf("("));
                            date = date.substring(0, date.indexOf(" GMT"));

                            runtime.db.run("INSERT INTO logs(name, date_time, rfid, phone_number, ent_id, is_in) VALUES(\"" + entityName + "\", \"" + date + "\", \"" + rfid + "\", \"" + entityPhoneNumber + "\", \"" + entityId + "\", " + (rows[0].is_in == "0" ? "1" : "0") + ")");
                            runtime.db.run("UPDATE accounts SET is_in=" + (rows[0].is_in == "0" ? "1" : "0") + " WHERE rfid=\"" + rfid + "\"");

                            dataTable.row.add([date, entityId, entityPhoneNumber, entityName, (rows[0].is_in != "0" ? "&#9898;" : "&#9899;")]);
                            dataTable.draw();
                        }
                    });
                }).fail(()=> $("#disconnected-error").removeClass("d-none")), 1800);

                runtime.moveToSectionEvent = ()=> {
                    dataTable.destroy();

                    clearInterval(readingInterval);
                    clearInterval(resetPreviousID);
                };
            });
        });
    },

    addEntityModal: ()=> {
        Modal.showModal("add-entity");

        let tapInterval = setInterval(()=> $.post(runtime.server + "/read", {}, (data)=> {
            let rfid = data.toString().trim();

            if(rfid == "00-00-00-00")
                return;

            $("#add-entity-no-rfid").addClass("d-none");
            $("#add-entity-rfid-barcode").removeClass("d-none");
            $("#add-entity-rfid").attr("value", rfid);

            JsBarcode("#add-entity-rfid-barcode", rfid, { displayValue: false });
        }), 1800);

        runtime.moveToSectionEvent = ()=> clearInterval(tapInterval);
    },

    addAdminModal: ()=> {
        Modal.showModal("add-admin");
    },

    executeAddEntity: ()=> {
        let name = $("#add-entity-name").val(), phoneNumber = $("#add-entity-phone-number").val(), entityId = $("#add-entity-ent-id").val(), rfid = $("#add-entity-rfid").val();
        $("#add-admin-error").addClass("d-none");

        if(!/^[a-zA-Z .]+$/.test(name) && name.length < 10) {
            $("#add-entity-error").removeClass("d-none");
            $("#add-entity-error-text").html("Invalid new entity name.");

            return;
        }
    },

    executeAddAdministrator: ()=> {
        let username = $("#add-admin-username").val(), password = $("#add-admin-password").val(), confirmPassword = $("#add-admin-password-confirmation").val();

        if(!username || username == "") {
            $("#add-admin-error").removeClass("d-none");
            $("#add-admin-error-text").html("Username cannot be empty.");

            return;
        }

        if(!/^[a-zA-Z0-9_]+$/.test(username)) {
            $("#add-admin-error").removeClass("d-none");
            $("#add-admin-error-text").html("Invalid new admin username.");

            return;
        }

        if(!password || password == "") {
            $("#add-admin-error").removeClass("d-none");
            $("#add-admin-error-text").html("Password cannot be empty.");

            return;
        }

        if(!confirmPassword || confirmPassword == "") {
            $("#add-admin-error").removeClass("d-none");
            $("#add-admin-error-text").html("Password confirmation cannot be empty.");

            return;
        }

        if(password != confirmPassword) {
            $("#add-admin-error").removeClass("d-none");
            $("#add-admin-error-text").html("Password confirmation did not match.");

            return;
        }

        username = base64.encode(username);
        password = base64.encode(md5(password));

        runtime.db.serialize(()=> {
            runtime.db.all("SELECT username FROM admins WHERE username=\"" + username + "\"", (err, rows)=> {
                if(!err && rows.length == 0) {
                    runtime.db.run("INSERT INTO admins (username, password, account_type) VALUES(\"" + username + "\", \"" + password + "\", 0)");

                    Modal.closeModal("add-admin");
                    Modal.messageModal("Administrator Added", "New administrator account was successfully added!")
                }
                else if(rows.length > 0) {
                    $("#add-admin-error").removeClass("d-none");
                    $("#add-admin-error-text").html("Username already in use.");
                }
                else {
                    $("#add-admin-error").removeClass("d-none");
                    $("#add-admin-error-text").html(err);
                }
            });
        });
    }
};

$(document).ready(()=> {
    require("popper.js");
    require("bootstrap");

    $(".dropdown-toggle").dropdown();
    App.showSplashScreen();
});
