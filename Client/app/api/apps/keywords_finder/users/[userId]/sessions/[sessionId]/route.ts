import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ userId: string; sessionId: string }> }
) {
    try {
        // With Next.js App Router, we need to await the params object itself
        const params = await context.params;
        const userId = params.userId;
        const sessionId = params.sessionId;
        const body = await request.json();

        // Forward the request to the FastAPI backend
        const response = await fetch(
            `http://localhost:8000/apps/keywords_finder/users/${userId}/sessions/${sessionId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            }
        );

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
        console.error("Error in keywords_finder session API route:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
