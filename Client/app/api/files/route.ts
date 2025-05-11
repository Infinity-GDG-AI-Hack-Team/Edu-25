import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Extract data from the form
        const file = formData.get('file') as File;
        const projectName = formData.get('project_name') as string;
        const currentActiveFile = formData.get('current_active_file') as string;
        const studentId = formData.get('student_id') as string;

        if (!file || !projectName || !currentActiveFile || !studentId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Convert file to byte array
        const fileBuffer = await file.arrayBuffer();
        const fileContent = Array.from(new Uint8Array(fileBuffer));

        // Prepare request to backend
        const payload = {
            project_name: projectName,
            current_active_file: currentActiveFile,
            student_id: studentId,
            file_content: fileContent
        };

        // Send to FastAPI backend
        const response = await fetch("http://localhost:8003/api/files/upload", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Backend returned error: ${response.status} - ${errorText}`);
            return NextResponse.json(
                { error: "Error from backend service" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in file upload API route:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('student_id');
        const projectName = searchParams.get('project_name');

        let url = 'http://localhost:8003/api/files';

        if (studentId) {
            url = `${url}/student/${studentId}`;
        } else if (projectName) {
            url = `${url}/project/${encodeURIComponent(projectName)}`;
        } else {
            return NextResponse.json(
                { error: "Missing required query parameters" },
                { status: 400 }
            );
        }

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            console.error(`Backend returned error: ${response.status}`);
            return NextResponse.json(
                { error: "Error from backend service" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in file retrieval API route:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
