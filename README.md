Hacklaton Education track project


# Installation
Run poetry install
then poetry shell

# Running the FastAPI Server
After activating the poetry shell, run the following commands:
```bash
cd Server/
uvicorn main:app --host 0.0.0.0 --port 8000
```

Once the server is running, you can access the API documentation at:
```
http://localhost:8000/docs
```

You can open the documentation in your browser with:
```bash
"$BROWSER" http://localhost:8000/docs
```

# Next.js Client Setup
To set up the Next.js client application, navigate to the Client directory and run the following commands:

```bash
cd Client/
npm install --legacy-peer-deps
npm run dev
```

# Running the Complete Application
You can use the setup_and_run.sh script to set up and run both the server and client:

```bash
./setup_and_run.sh
```
