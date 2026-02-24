## **Step-by-Step Guide to Set Up the Server**

Important: Steps 1 to 4 are already implemented in the server, they are only needed on a new configuration.

### **1. Prerequisites:**

Ensure the following tools and packages are installed on the server:

* **Python 3.10+**
* **pip** (Python package manager)
* **virtualenv** (for creating virtual environments)
* **Gunicorn** (WSGI HTTP server for Python web apps)
* **systemd** (for managing the Flask app as a service)
* **NVIDIA drivers and CUDA** (if using GPU acceleration, but we'll focus on CPU-only mode here)

---

### **2. Setting Up the Environment**

#### **2.1. Create the Virtual Environment**

The virtual environment allows you to isolate dependencies for the Flask app.

1. **Navigate to your project directory** (if not already inside it):

   ```bash
   cd /home/rjorge/Stellarator_Webapp
   ```

2. **Create the virtual environment**:

   ```bash
   python3 -m venv stellarator_venv
   ```

3. **Activate the virtual environment**:

   ```bash
   source stellarator_venv/bin/activate
   ```

#### **2.2. Install Project Dependencies**

1. **Install Flask**:

   ```bash
   pip install flask
   ```

2. **Install Gunicorn**:
   Gunicorn is a production-grade WSGI server to serve Flask.

   ```bash
   pip install gunicorn
   ```

3. **Install JAX (CPU version)** (optional, if using JAX):
   To run JAX in CPU-only mode:

   ```bash
   pip install jax[cpu]
   ```

4. **Install any other dependencies** needed by the project (e.g., `essos`, `qsc`):

   ```bash
   pip install essos qsc  # Or any other dependencies
   ```

---

### **3. Set Up Gunicorn as a Systemd Service**

You’ll need to create a **systemd service** to ensure that the Flask app runs in the background and restarts automatically.

#### **3.1. Create a Systemd Service File**

1. **Create the systemd service file** in `/etc/systemd/system/stellarator-flask.service`:

   ```bash
   sudo nano /etc/systemd/system/stellarator-flask.service
   ```

2. **Add the following configuration** to the file:

   ```ini
   [Unit]
   Description=Flask Backend for Stellarator Webapp
   After=network.target

   [Service]
   Type=simple
   WorkingDirectory=/home/rjorge/Stellarator_Webapp
   ExecStart=/home/rjorge/stellarator_venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 app.backend.routes:app
   User=rjorge
   Group=rjorge
   Restart=always
   Environment="PATH=/home/rjorge/stellarator_venv/bin"
   Environment="FLASK_APP=/home/rjorge/Stellarator_Webapp/app/backend/routes.py"

   [Install]
   WantedBy=multi-user.target
   ```

   This file defines:

   * **WorkingDirectory**: The directory where the Flask app is located.
   * **ExecStart**: The Gunicorn command to start the app.
   * **User** and **Group**: Running as `rjorge`.
   * **Restart=always**: Ensures the app restarts if it crashes.

3. **Save and exit** (`Ctrl + O`, `Enter`, `Ctrl + X`).

#### **3.2. Reload Systemd and Start the Service**

1. **Reload systemd to apply the changes**:

   ```bash
   sudo systemctl daemon-reload
   ```

2. **Start the Flask app service**:

   ```bash
   sudo systemctl start stellarator-flask.service
   ```

3. **Enable the service to start on boot**:

   ```bash
   sudo systemctl enable stellarator-flask.service
   ```

4. **Check the status of the service** to verify it's running:

   ```bash
   sudo systemctl status stellarator-flask.service
   ```

   If successful, the output should show that the service is **active (running)**.

---

### **4. Disable GPU Usage (Optional)**

If your application uses **JAX** or other libraries that try to access the GPU, and you want to disable GPU usage, follow these steps:

#### **4.1. Ensure JAX Uses Only the CPU**

In your Python code (or a separate script), add the following to ensure JAX uses the CPU:

```python
import jax
from jax.config import config

# Force JAX to use CPU even if CUDA is available
config.update("jax_platform_name", "cpu")
```

#### **4.2. Set the `CUDA_VISIBLE_DEVICES` to Empty**

To prevent **CUDA** from being detected, set this environment variable:

1. **Add the following line to `~/.bashrc`**:

   ```bash
   echo 'export CUDA_VISIBLE_DEVICES=""' >> ~/.bashrc
   ```

2. **Reload `~/.bashrc` to apply**:

   ```bash
   source ~/.bashrc
   ```

This ensures that **JAX** and other frameworks won’t try to use the GPU.

---

### **5. Verify the Setup**

After everything is set up, follow these steps to verify:

1. **Check the app by visiting the URL** in your browser:

   * If testing locally: `http://127.0.0.1:5000`
   * If testing remotely: `http://<your-server-ip>:5000`

2. **Monitor the service** for logs:

   ```bash
   sudo journalctl -u stellarator-flask.service -f
   ```

3. **Test server restart** by rebooting the system:

   ```bash
   sudo reboot
   ```

   After the system reboots, verify the service is still running:

   ```bash
   sudo systemctl status stellarator-flask.service
   ```

---

## **User Documentation for Maintenance**

### **1. Starting the Flask App**

* The Flask app is set up as a **systemd service**, which ensures it starts on system boot and restarts automatically if it crashes.
* To manually start or stop the Flask app:

  * **Start the app**:

    ```bash
    sudo systemctl start stellarator-flask.service
    ```
  * **Stop the app**:

    ```bash
    sudo systemctl stop stellarator-flask.service
    ```
  * **Restart the app**:

    ```bash
    sudo systemctl restart stellarator-flask.service
    ```

### **2. Checking the Flask App Status**

To check the current status of the Flask app:

```bash
sudo systemctl status stellarator-flask.service
```

This command will show whether the service is **active**, **inactive**, or has failed.

### **3. Viewing Logs**

To view logs generated by the Flask app, use the `journalctl` command:

```bash
sudo journalctl -u stellarator-flask.service -f
```

This will show real-time logs of the Flask application.

### **4. Modifying Gunicorn Settings**

If you need to change the number of **Gunicorn workers** or modify any other settings in the service, edit the **systemd service file** at `/etc/systemd/system/stellarator-flask.service`:

1. **Edit the service file**:

   ```bash
   sudo nano /etc/systemd/system/stellarator-flask.service
   ```

2. Modify the `-w` option to change the number of workers:

   ```ini
   ExecStart=/home/rjorge/stellarator_venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 app.backend.routes:app
   ```

3. **Reload systemd and restart the service**:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart stellarator-flask.service
   ```

### **5. Disabling GPU Usage (If Needed)**

To ensure **JAX** or any other application does not use the GPU:

1. Add the following to your Python code:

   ```python
   import jax
   from jax.config import config
   config.update("jax_platform_name", "cpu")
   ```

2. Set the environment variable to **disable CUDA**:

   ```bash
   export CUDA_VISIBLE_DEVICES=""
   ```

3. Make this setting permanent by adding it to your `~/.bashrc` file:

   ```bash
   echo 'export CUDA_VISIBLE_DEVICES=""' >> ~/.bashrc
   source ~/.bashrc
   ```

### **6. Troubleshooting**

* **App not starting**: Check the logs for errors using `sudo journalctl -u stellarator-flask.service`.
* **App crashes after a while**: Check for memory issues or errors related to dependencies (e.g., `qsc`, `jax`).
* **Out of memory errors**: Try running the app on **CPU-only mode** or reduce the number of Gunicorn workers.

