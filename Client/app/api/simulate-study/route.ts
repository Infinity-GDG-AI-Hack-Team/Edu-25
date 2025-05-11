import { NextRequest, NextResponse } from 'next/server';

interface StudyRequest {
    keyword: string;
}

export async function POST(request: NextRequest) {
    try {
        const reqBody: StudyRequest = await request.json();

        // Make sure we have a keyword
        if (!reqBody.keyword) {
            return NextResponse.json(
                { error: 'Keyword is required' },
                { status: 400 }
            );
        }

        // Forward the request to the backend API
        const apiUrl = process.env.API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/simulate-study`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                keyword: reqBody.keyword
            }),
        });

        // Return the response from the backend
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error('Error in simulate-study API route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}