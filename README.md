<p align="center">
	<img src="Monitoria-Attendance-Web-App/assets/monitoria-logo.png" width="120" />
</p>

# Monitoria

Monitoria is a comprehensive attendance monitoring system that utilizes an ESP8266 microcontroller unit along with an RFID sensor to record attendance logs. This project also includes a user-friendly desktop web-based application built with ElectronJS, enabling administrators to monitor attendance logs, manage entities, and save logs as CSV files. The system incorporates various features such as real-time LCD I2C display on the ESP8266, SMS notifications to entities upon tapping their RFID cards or handheld keys, and error handling for unregistered RFIDs. The communication between the desktop application and the ESP8266 is established through a WiFi connection, with the ESP8266 acting as an access point.

## Features

### Pros:

1.  *Efficient Attendance Monitoring:* Monitoria provides an efficient solution for attendance monitoring using RFID technology. It allows entities to tap their RFID cards or handheld keys, automatically recording their attendance logs.
    
2.  *Real-time Information Display:* The integration of an LCD I2C display with the ESP8266 microcontroller enables real-time display of entity names and IDs. This feature enhances the user experience by providing instant feedback during the attendance recording process.
    
3.  *Desktop Web-Based Application:* The inclusion of a user-friendly desktop web-based application built with ElectronJS allows administrators to conveniently monitor attendance logs, manage entities, and export logs as CSV files. The application provides a comprehensive interface for efficient management of the attendance system.
    
4.  *SMS Notifications:* Monitoria goes beyond just recording attendance by sending SMS notifications to entities upon tapping their RFID cards or handheld keys. This feature ensures that entities receive instant confirmation of their attendance and enhances communication within the system.
    
5.  *Error Handling:* The project incorporates error handling mechanisms for unregistered RFIDs. When an unregistered RFID is detected, Monitoria displays an error message, ensuring that attendance records remain accurate and reliable.
    
6.  *Wireless Communication:* The communication between the desktop application and the ESP8266 is established through a WiFi connection. This wireless communication eliminates the need for physical connections and offers flexibility in accessing and managing the attendance system.

### Cons:

1.  *Hardware Dependencies:* The Monitoria project relies on specific hardware components; the ESP8266 microcontroller, RFID sensor, SIM800L module, and LCD I2C display. While these components are widely available, users may need to fully procure them to implement the project.
    
2.  *Technical Expertise:* Setting up and configuring the Monitoria project requires technical expertise in working with microcontrollers, RFID sensors, and firmware programming. Users without prior experience in these areas may need to invest time in learning and understanding the necessary concepts.
    
3.  *Limited Scalability:* The current implementation of Monitoria may have limitations in terms of scalability. Depending on the requirements, additional hardware and software modifications may be necessary to support a larger number of entities and enhance the system's scalability.
    
4.  *Maintenance and Support:* As with any technology project, ongoing maintenance and support may be required. Users should be prepared to allocate resources for troubleshooting, bug fixes, and potential future enhancements.
    
5.  *Limited Platform Compatibility:* The desktop web-based application developed with ElectronJS is compatible with major operating systems (Windows, macOS, and Linux). However, mobile platforms (iOS and Android) are not currently supported, limiting the accessibility of the application on these devices.

## Getting Started

To set up Monitoria and start using the attendance monitoring system, please follow the steps below:

### Hardware Set-up

1. Wire up and follow the schematic diagram at [Monitoria-Attendance-Schematics](Monitoria-Attendance-Schematics).
2. Open Visual Studio Code. Install the [PlatformIO](https://platformio.org) extension if you don't have it yet; otherwise, open the [Monitoria-Attendance-ESP8266-System](Monitoria-Attendance-ESP8266-System) on the PlatformIO.
3. Click the upload button at the status bar. If the wiring is correct, it should upload easily on your board.

> **Note**: Temporarily disconnect the SIM800L's RX and TX pins from the ESP8266 NodeMCU board when uploading the code.
> 
> Removing the RX and TX pins of other UART modules on an Arduino board is not always a must when uploading a program firmware, but it can be necessary in certain situations such as conflict with the serial communication.

### Software Set-up


1. Clone the Monitoria repository from GitHub.
    ```batch
    git clone https://github.com/nthnn/Monitoria.git
    ```

> **Note**: Before proceeding on step 2, NodeJS must be installed on your system first.

2. Then, from the command line, move to the folder of the cloned repository and install the required Node modules.
    ```batch
    cd Monitoria
    cd Monitoria-Attendance-Web-App
    npm i
    ```
3. Change the working directory to the installer generator, and start building the desktop app.
    ```batch
    cd ../Monitoria-Attendance-Installer-Generator
    npm i
    npm run packager
    npm run build
    npm run clean
    ```
4. After successfully building the installer, you'll find a folder named ```dist``` on the root directory of the cloned repository. The program can be now installed on your system.

### Connectiong Set-up

1. **Hardware Set-up**
- The hardware must be powered up through an external power supply (any of your choice as long as it's regulated down to ```5V``` for the ```VIN``` pin of the ESP8266).

2. **Software Set-up**
- After powering up the hardware, find and connect to the available WiFi access point, with SSID named "*Monitoria*." If you haven't modified the [monitoria_config.h](Monitoria-Attendance-ESP8266-System/include/monitoria_config.h), the default password would be "*!tUblxofr6k+fretr&h5*" without the double quotation marks.
- If you have successfully connected to the access point, you can now run the installed desktop app of the system. The default administrator user name is "*admin*" with the password "*123*" Classic, right?

## Why Monitoria?

In today's fast-paced world, efficient attendance management is a critical aspect for individuals, communities, businesses, and organizations alike. The Monitoria attendance monitoring system offers a comprehensive solution that leverages RFID technology, a desktop web-based application, and real-time communication to streamline attendance tracking. By utilizing this system, individuals, communities, businesses, and organizations can experience a range of benefits that enhance operational efficiency, data accuracy, security, and overall productivity.

One of the key advantages of the Monitoria system is its ability to simplify attendance management. With the integration of RFID technology, entities can effortlessly record their attendance by tapping their RFID cards or handheld keys. This eliminates the need for traditional manual methods, such as paper-based attendance registers or manual data entry. The system automates the process, reducing administrative workload and freeing up valuable time for individuals, communities, businesses, and organizations.

Manual attendance tracking is susceptible to human error and fraudulent entries. Monitoria addresses this concern by providing accurate and reliable attendance data. The RFID technology ensures that attendance records are automatically captured, leaving no room for discrepancies. Organizations can make informed decisions based on trustworthy attendance records, leading to improved efficiency and effective resource allocation.

The desktop web-based application integrated within the Monitoria system offers real-time monitoring of attendance logs. Administrators can conveniently view attendance records and identify any irregularities promptly. Additionally, the system sends SMS notifications to entities upon tapping their RFID cards, offering instant confirmation of attendance. This feature enhances communication within the organization or community, fostering transparency and accountability.

Security and access control are critical considerations in any attendance management system. Monitoria enhances security by utilizing RFID technology. Entities are provided with unique RFID cards or handheld keys, ensuring that only authorized individuals can record their attendance. The system identifies unregistered RFIDs as errors, preventing unauthorized access and maintaining a secure environment. This feature is particularly beneficial for organizations that prioritize strict access control measures.

Moreover, the Monitoria system simplifies data management through its desktop application. Administrators can easily add or remove entities, update entity information, and export attendance logs as CSV files. This streamlined process ensures organized and easily accessible attendance records. Furthermore, generating reports and analyzing attendance data becomes effortless, empowering administrators to make data-driven decisions.

Monitoria offers flexibility and scalability to adapt to diverse requirements. The system utilizes widely available hardware components, such as the ESP8266 microcontroller and RFID sensor.

Furthermore, by automating the attendance management process, Monitoria brings significant time and cost savings. The system eliminates the need for manual tracking and data entry, freeing up administrators' time for more important tasks. Additionally, the transition from paper-based attendance registers to the digital Monitoria system reduces stationery costs and contributes to environmental sustainability.

Last, but not least, why not?

## Contributing

Contributions to Monitoria are welcome. If you encounter any issues, have suggestions for improvements, or would like to add new features, please feel free to submit a pull request. For major changes, please open an issue first to discuss the proposed modifications.

When contributing to this project, please ensure that you follow the established code style and best practices. Moreover, provide detailed information about your changes to facilitate the review process.

## License

Copyright 2023 - Nathanne Isip

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

```THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.```