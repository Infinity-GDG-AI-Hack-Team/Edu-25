import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Extract data from the form
        const file = formData.get('file') as File;
        const projectName = formData.get('project_name') as string;
        const studentId = formData.get('student_id') as string;

        if (!file || !projectName) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        console.log(`Uploading file: ${file.name} for project: ${projectName}`);

        // Create a new FormData object for the backend request
        const backendFormData = new FormData();
        backendFormData.append('file', file);

        // Use the new upload-pdf endpoint we created in the server
        const response = await fetch(`http://localhost:8003/api/files/upload-pdf?project_name=${encodeURIComponent(projectName)}`, {
            method: "POST",
            body: backendFormData,
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
