const path = require("path");
const fs = require("fs");
const { dialog } = require("@electron/remote");

const $ = require("jquery");
const jQuery = $;

const sqlite3 = require("sqlite3").verbose();
const md5 = require("md5");
const base64 = require("base-64");
const crypto = require("crypto");

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
                "add-entity-ent-id",

                "add-admin-username",
                "add-admin-password",
                "add-admin-password-confirmation"
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

    saveAsCsv: ()=> {
        runtime.db.serialize(()=> {
            runtime.db.all("SELECT * FROM logs", (err, rows)=> {
                if(err) {
                    Modal.messageModal("Error Saving Logs", "Something went wrong while trying to save logs to file.");
                    runtime.moveToSectionEvent = null;
                }
                else dialog.showSaveDialog({
                    title: "Save Logs",
                    defaultPath: "~/Documents/",
                    buttonLabel: "Save",
                    filters: [
                        { name: "CSV Files", extensions: [ "csv" ] },
                        { name: "All Files", extensions: [ "*" ] }
                    ]
                }).then(result => {
                    if(result.filePath)
                        fs.writeFile(result.filePath,
                            rows.map(row => Object.values(row).join(",")).join("\n"),
                            (err)=> {
                                if(err)
                                    Modal.messageModal("Error Saving Logs", "Something went wrong while trying to save logs to file.");
                                else Modal.messageModal("Saved", "Logs has been successfully saved!");

                                runtime.moveToSectionEvent = null;
                            }
                        );
                });
            });
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

    showAccounts: ()=> {
        App.renderEntities();
        App.renderAdmins();
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
                    if(rfid == "00-00-00-00")
                        return;

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

                            $.post(runtime.server + "/data?status=1&ent_name=" + entityName.replace(" ", "+")
                                + "&ent_id=" + entityId
                                + "&ent_cp=" + entityPhoneNumber
                                + "&hash=" + crypto.randomBytes(20).toString('hex')
                                + "&log_time=" + date.substring(12, 17),
                                {},
                                (_)=> console.log(_));

                            dataTable.row.add([date, entityId, entityPhoneNumber, entityName, (rows[0].is_in != "0" ? "&#9898;" : "&#9899;")]);
                            dataTable.draw();
                        }
                        else $.post(runtime.server + "/data?status=0", {}, (_)=> {});
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

    deleteEntity: (id)=> {
        Modal.showModal("delete-entity");

        $("#delete-entity-btn").on("click", ()=> {
            runtime.db.serialize(()=> {
                runtime.db.run("DELETE FROM accounts WHERE id=" + id);
                App.renderEntities();

                Modal.closeModal("delete-entity");
                Modal.messageModal("Entity Deleted", "Entity account had been deleted successfully!");
            });
        });
    },

    deleteAdmin: (id)=> {
        Modal.showModal("delete-admin");

        $("#delete-admin-btn").on("click", ()=> {
            runtime.db.serialize(()=> {
                runtime.db.run("DELETE FROM admins WHERE id=" + id);
                App.renderAdmins();

                Modal.closeModal("delete-admin");
                Modal.messageModal("Admin Deleted", "Administrator account had been deleted successfully!");
            });
        });
    },

    renderEntities: ()=> {
        runtime.db.serialize(()=> {
            runtime.db.all("SELECT id, name, phone_number, rfid, ent_id FROM accounts", (err, rows)=> {
                if(!err) {
                    if(rows.length == 0) {
                        $("#no-entities").removeClass("d-none");
                        $("#entity-list").html("");

                        return;
                    }

                    let entityCards = "<div class=\"row equal-cols\">", count = 0;
                    for(let row of rows) {
                        if(count % 2 == 0)
                            entityCards += "</div><br/><div class=\"row equal-cols\">";

                        entityCards += "<div class=\"col-lg-6\"><div class=\"card card-body border-secondary border\"><img id=\"barcode-" + row.id + "\" /><h3>" + row.name + "</h3><small class=\"text-muted\">" + row.ent_id + " / " + row.phone_number + "</small><hr/><button class=\"btn btn-outline-danger\" onclick=\"App.deleteEntity(" + row.id + ")\">Delete</button></div></div>";
                        count++;
                    }

                    $("#no-entities").addClass("d-none");
                    $("#entity-list").html(entityCards + "</div>");
                }
            });
        });
    },

    renderAdmins: ()=> {
        runtime.db.serialize(()=> {
            runtime.db.all("SELECT id, username FROM admins", (err, rows)=> {
                if(!err) {
                    let adminCards = "<div class=\"row equal-cols\">", count = 0;

                    for(let row of rows) {
                        if(count % 2 == 0)
                            adminCards += "</div><br/><div class=\"row equal-cols\">";

                        adminCards += "<div class=\"col-lg-6\"><div class=\"card card-body border-secondary border\"><h3>" + base64.decode(row.username) + "</h3><hr/>" + (cache.userId != row.id ? ("<button class=\"btn btn-outline-danger\" onclick=\"App.deleteAdmin(" + row.id + ")\">Delete</button>") : "<p class=\"text-muted\">(In-use)</p>") + "</div></div>";
                        count++;
                    }

                    $("#admins").html(adminCards + "</div>");
                }
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

        if(!name || name == "") {
            $("#add-entity-error").removeClass("d-none");
            $("#add-entity-error-text").html("Entity name cannot be empty.");

            return;
        }

        if(!/^[a-zA-Z .]+$/.test(name) && name.length < 10) {
            $("#add-entity-error").removeClass("d-none");
            $("#add-entity-error-text").html("Invalid new entity name.");

            return;
        }

        if(!phoneNumber || phoneNumber == "") {
            $("#add-entity-error").removeClass("d-none");
            $("#add-entity-error-text").html("Entity phone number cannot be empty.");

            return;
        }

        if(!/^\+?\d+$/.test(phoneNumber)) {
            $("#add-entity-error").removeClass("d-none");
            $("#add-entity-error-text").html("Invalid new entity phone number.");

            return;
        }

        if(!entityId || entityId == "") {
            $("#add-entity-error").removeClass("d-none");
            $("#add-entity-error-text").html("Entity ID cannot be empty.");

            return;
        }

        if(!/^\d+$/.test(entityId)) {
            $("#add-entity-error").removeClass("d-none");
            $("#add-entity-error-text").html("Invalid new entity ID. It should contain numbers only.");

            return;
        }

        if(!rfid || rfid == "") {
            $("#add-entity-error").removeClass("d-none");
            $("#add-entity-error-text").html("Entity RFID cannot be empty. Please, tap a card.");

            return;
        }

        /*if(!/^([0-9A-Fa-f]{2}-){3}[0-9A-Fa-f]{2}$/.test(rfid)) {
            $("#add-entity-error").removeClass("d-none");
            $("#add-entity-error-text").html("Invalid RFID card detected.");

            return;
        }*/

        runtime.db.serialize(()=> {
            runtime.db.all("SELECT * FROM accounts WHERE rfid=\"" + rfid + "\" OR phone_number=\"" + phoneNumber + "\" OR ent_id=\"" + entityId + "\"", (err, rows)=> {
                if(err) {
                    $("#add-entity-error").removeClass("d-none");
                    $("#add-entity-error-text").html("Something went wrong.");
        
                    return;
                }

                if(rows.length != 0) {
                    $("#add-entity-error").removeClass("d-none");
                    $("#add-entity-error-text").html("Either RFID, phone number, or entity ID was already in use.");
        
                    return;
                }

                runtime.db.run("INSERT INTO accounts (name, phone_number, rfid, is_in, ent_id) VALUES(\"" + name + "\", \"" + phoneNumber + "\", \"" + rfid + "\", 0, " + entityId + ")");
                App.renderEntities();

                Modal.closeModal("add-entity");
                Modal.messageModal("Entity Added", "The entity was successfully added!");
            });
        });
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
                    App.renderAdmins();

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
