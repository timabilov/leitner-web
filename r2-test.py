import requests
import io
import zipfile

def log_and_upload(presigned_url: str):
    """
    Creates a fake zip, prints the full request structure before sending,
    sends the request, and prints the response.
    """
    
    # --- 1. Create the Fake Zip File Data ---
    in_memory_zip_buffer = io.BytesIO()
    with zipfile.ZipFile(in_memory_zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("note.txt", "This is a test file from the Python script.")
    in_memory_zip_buffer.seek(0)
    zip_content = in_memory_zip_buffer.read()

    # --- 2. Prepare the Request to Inspect It ---
    # We only need to define the headers that we are manually controlling.
    manual_headers = {
        'Content-Type': 'application/zip'
    }

    # Use a Session object to prepare the request. This is how 'requests'
    # adds automatic headers like Content-Length, Host, etc.
    session = requests.Session()
    req = requests.Request('PUT', presigned_url, data=zip_content, headers=manual_headers)
    prepared_request = session.prepare_request(req)

    # --- 3. Print the Request Footprint (THE PART YOU NEED) ---
    print("--- 🔍 REQUEST FOOTPRINT (What Python is Sending) ---")
    print(f"{prepared_request.method} {prepared_request.path_url}")
    print("\n[HEADERS]")
    for key, value in prepared_request.headers.items():
        print(f"  {key}: {value}")
    
    print("\n[BODY]")
    print(f"  Type: Binary Data")
    print(f"  Size: {len(prepared_request.body)} bytes")
    # Trim the file bytes to show a small sample
    print(f"  Content (first 50 bytes): {prepared_request.body[:50]}...")
    print("-----------------------------------------------------\n")


    # --- 4. Now, Actually Send the Prepared Request ---
    print("Sending the prepared request to the server...")
    try:
        response = session.send(prepared_request, timeout=10) # 10 second timeout

        # --- 5. Print the Server's Response ---
        print("\n--- RESPONSE (What the Server Sent Back) ---")
        print(f"Status: {response.status_code} {response.reason}")
        print("\n[RESPONSE HEADERS]")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")
        
        print("\n[RESPONSE BODY]")
        print(response.text if response.text else "(No body in response)")
        print("--------------------------------------------------\n")

        if 200 <= response.status_code < 300:
            print("✅ VERDICT: SUCCESS. The request structure above is valid.")
        else:
            print("❌ VERDICT: FAILURE. The server rejected the request.")

    except requests.exceptions.RequestException as e:
        print(f"\n❌ REQUEST FAILED: {e}")

# --- MAIN ---
if __name__ == "__main__":
    url ="https://lessnotestorage.375ad218a5792d29ba7b6cf710df4bc8.r2.cloudflarestorage.com/notes/my-archive_1762264610072.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=8c81eb12a1635df6d6fc204f2b3b279f%2F20251104%2F%2Fs3%2Faws4_request&X-Amz-Date=20251104T135650Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&x-id=PutObject&X-Amz-Signature=d1e25b1409e7bf731f1533e43351315bfbdbb12d2e11a9c3d0a4b441e6d390f3"
    log_and_upload(url)