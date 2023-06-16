require("bootstrap");

const $ = require("jquery");
const SerialPort = require('serialport').SerialPort;

let runtime = {
    port: null
};

let cache = {
    prevPorts: []
}

const App = {
    showSplashScreen: (nextContent)=> {
        setTimeout(()=> {
            $("#splash-screen").addClass("animate__fadeOut");
            $("#main-content").removeClass("d-none").addClass("animate__fadeIn");

            setTimeout(()=> $("#config-section").removeClass("d-none").addClass("animate__slideInDown"), 800);
            App.configSection();
        }, 3000);
    },

    configSection: ()=> {
        setInterval(()=> {
            let availablePorts = $("#available-ports");

            SerialPort.list()
                .then((ports) => {
                    if(JSON.stringify(cache.prevPorts) === JSON.stringify(ports))
                        return;

                    availablePorts.html("");
                    cache.prevPorts = ports;

                    ports.forEach((port)=>
                        availablePorts.append("<option value=\"" + port.path + "\">" + port.friendlyName + "</option>"));
                })
                .catch((err) => console.error('Error listing COM Ports:', err));
        }, 1000);
    }
}

$(document).ready(()=> App.showSplashScreen());
