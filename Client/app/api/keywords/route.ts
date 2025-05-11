import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint for keywords extraction
 * Forwards requests to our API server
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Call the keywords endpoint of our API server
        const response = await fetch('http://localhost:8000/keywords', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Error from keywords API:', errorData);
            return NextResponse.json(
                { error: 'Failed to process text with keywords API' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error in keywords API route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}