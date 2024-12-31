# NFC Lock with MQTT
This application is designed by integrating a custom device from the ESP32 system, which controls the Solenoid Door for locking the door. The application uses a simple principle for communication with the device, where the smartphone is brought close to the system to trigger the NFC coil. The data inside the NFC chip contains system information like the MQTT topic, which is used as the address path to the Broker from the smartphone.

# Dashboard
   The Dashboard view displays several features, such as the application status with the MQTT broker, user management, history, Wi-Fi direct, and devices, with details as follows:
   1. **User**  
        The user menu is used to add users to use this application.
   2. **History**  
        This menu allows you to view the history of user access to the system.
   3. **Wi-Fi Direct**  
        This feature allows direct communication between the smartphone and the system as an emergency path if the system is not connected to the internet.
   4. **Devices**  
        The device menu is used to add new devices.

   And several other views like the summary of the history.

![Gambar WhatsApp 2025-01-01 pukul 00 35 10_f8dc7303](https://github.com/user-attachments/assets/5fd702fd-839f-4195-a7cc-5798b302a1de=250x250)
![Gambar WhatsApp 2025-01-01 pukul 00 35 10_6f47fb60](https://github.com/user-attachments/assets/e758311b-6268-492a-af82-7e400f225a2d)
![Gambar WhatsApp 2025-01-01 pukul 00 35 09_498b0b8c](https://github.com/user-attachments/assets/5f1b96fc-f5c2-40ba-874c-f70f7257bc68)


# Archive
   This view is specifically used by the admin to monitor the application and system, where they can see the history of user access and the system logs.
